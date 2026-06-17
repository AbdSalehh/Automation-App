import { prisma } from "@/shared/lib/prisma";
import { getRedisClient } from "@/shared/lib/redis";
import { GEMINI_MODEL } from "@/shared/config/constants";
import { runWorkflow } from "@/shared/server/engine";
import { buildWorkflowFromPrompt } from "@/shared/server/workflowBuilder";
import type { FlowNode } from "@/entities/workflow/model/workflow.model";
import {
  getNodeTypeDef,
  type NodeKind,
} from "@/entities/workflow/model/node.model";
import { invalidateKeys, cacheKeys } from "@/shared/lib/cache";
import { publishWorkflowUpdate } from "@/shared/server/ablyPublisher";
import { classifyIntent, type WorkflowContext } from "./intentClassifier";

/**
 * Router agen chat-action (transport-agnostik).
 *
 * Memproses pesan masuk dari channel chat (mis. Telegram): mendeteksi konfirmasi
 * pembuatan yang tertunda, lalu mengklasifikasi maksud lewat Gemini dan
 * menjalankan tindakan (jawab pertanyaan / buat workflow / jalankan workflow /
 * tolak di luar konteks).
 *
 * Pengiriman balasan & indikator mengetik dilakukan lewat `transport` sehingga
 * router tidak terikat ke satu penyedia (Telegram/WhatsApp/dll.).
 *
 * Server-only module.
 */

/** Tombol inline yang bisa dikirim bersama balasan (mis. konfirmasi Ya/Batal). */
export interface AgentReplyButton {
  /** Teks yang tampil di tombol. */
  label: string;
  /** Data callback yang dikirim balik saat tombol ditekan. */
  value: string;
}

/** Adaptor pengiriman pesan untuk channel chat tertentu. */
export interface AgentTransport {
  /** Mengirim balasan teks ke pengirim, opsional dengan tombol inline. */
  reply: (text: string, buttons?: AgentReplyButton[]) => Promise<void>;
  /** Menampilkan indikator "sedang mengetik" (opsional, boleh no-op). */
  sendTyping: () => Promise<void>;
}

/** Tombol konfirmasi standar Ya / Batal untuk aksi yang menunggu persetujuan. */
const CONFIRM_BUTTONS: AgentReplyButton[] = [
  { label: "✅ Ya", value: "ya" },
  { label: "❌ Batal", value: "batal" },
];

export interface AgentRouterArgs {
  ownerId: string;
  /** Identitas pengirim pada channel (mis. chatId Telegram). */
  sender: string;
  message: string;
  geminiApiKey: string;
  geminiModel: string;
  transport: AgentTransport;
}

/** TTL state konfirmasi pembuatan (10 menit). */
const PENDING_TTL_SECONDS = 600;

/** Kata yang dianggap konfirmasi setuju / batal. */
const CONFIRM_WORDS = ["ya", "iya", "lanjut", "setuju", "ok", "oke", "yes"];
const CANCEL_WORDS = ["batal", "tidak", "ga", "gak", "no", "cancel"];

function pendingKey(ownerId: string, sender: string): string {
  return `agent-pending:${ownerId}:${sender}`;
}

/**
 * State konfirmasi yang disimpan di Redis. Membedakan aksi yang menunggu
 * jawaban "ya/batal": membuat baru, mengubah, atau menghapus workflow.
 */
interface PendingState {
  type: "create" | "edit" | "delete";
  prompt?: string;
  workflowId?: string;
  workflowName?: string;
}

/** Meng-escape karakter khusus HTML agar aman dimasukkan ke balasan Telegram. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Mengumpulkan ringkasan workflow milik pemilik untuk konteks classifier. */
async function loadWorkflowContext(
  ownerId: string,
): Promise<WorkflowContext[]> {
  const workflows = await prisma.workflow.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
  });

  return workflows.map((workflow) => {
    const nodes: FlowNode[] = JSON.parse(workflow.nodes || "[]");

    return {
      id: workflow.id,
      name: workflow.name,
      isPublished: workflow.isPublished,
      nodeCount: nodes.length,
      nodeKinds: nodes.map((node) => node.data.kind),
    };
  });
}

/**
 * Membangun workflow dari prompt lalu menyimpannya. Bila `existingWorkflowId`
 * diisi, workflow yang ada di-update di tempat (id dipertahankan, versi naik);
 * bila tidak, dibuat workflow baru. Balasan memakai HTML Telegram.
 */
async function buildAndReply(
  ownerId: string,
  prompt: string,
  geminiApiKey: string,
  geminiModel: string,
  reply: AgentTransport["reply"],
  existingWorkflowId?: string,
): Promise<void> {
  /**
   * Mode edit: muat workflow lama sebagai konteks agar Gemini mempertahankan
   * node yang tidak diubah dan hanya menyesuaikan yang diminta.
   */
  let existingContext: string | undefined;

  if (existingWorkflowId) {
    const current = await prisma.workflow.findFirst({
      where: { id: existingWorkflowId, ownerId },
    });

    if (current) {
      const currentNodes: FlowNode[] = JSON.parse(current.nodes || "[]");

      const nodeLines = currentNodes
        .map(
          (node) =>
            `- ${node.data.kind} (label: "${node.data.label}", config: ${JSON.stringify(
              node.data.config ?? {},
            )})`,
        )
        .join("\n");

      existingContext = [
        `Ini adalah workflow yang SUDAH ADA bernama "${current.name}".`,
        "Node saat ini:",
        nodeLines || "(tidak ada node)",
        "",
        "Bangun ulang workflow ini dengan menerapkan perubahan yang diminta,",
        "pertahankan node lain yang tidak disebutkan beserta config-nya.",
      ].join("\n");
    }
  }

  const built = await buildWorkflowFromPrompt(
    prompt,
    geminiApiKey,
    ownerId,
    geminiModel,
    existingContext,
  );

  const nodeSummary = built.nodes
    .map((node) => `• ${escapeHtml(node.data.label)}`)
    .join("\n");

  let savedId: string;

  if (existingWorkflowId) {
    const current = await prisma.workflow.findFirst({
      where: { id: existingWorkflowId, ownerId },
    });

    const updated = await prisma.workflow.update({
      where: { id: existingWorkflowId },
      data: {
        name: built.name,
        nodes: JSON.stringify(built.nodes),
        edges: JSON.stringify(built.edges),
        version: (current?.version ?? 1) + 1,
      },
    });

    savedId = updated.id;
  } else {
    const created = await prisma.workflow.create({
      data: {
        name: built.name,
        ownerId,
        nodes: JSON.stringify(built.nodes),
        edges: JSON.stringify(built.edges),
        isPublished: false,
      },
    });

    savedId = created.id;
  }

  await invalidateKeys(
    cacheKeys.workflowDetail(savedId),
    cacheKeys.workflowList(ownerId),
  );

  await publishWorkflowUpdate(ownerId, {
    action: existingWorkflowId ? "updated" : "created",
    workflowId: savedId,
  });

  const verb = existingWorkflowId ? "diperbarui" : "dibuat";

  let message = `✅ Otomasi <b>${escapeHtml(built.name)}</b> berhasil ${verb} dengan <b>${built.nodes.length} langkah</b>:\n${nodeSummary}`;

  if (built.missingCredentials.length > 0) {
    const missingSummary = built.missingCredentials
      .map(
        (missing) =>
          `• ${escapeHtml(missing.nodeLabel)} <i>(perlu kredensial ${escapeHtml(
            missing.credentialType,
          )})</i>`,
      )
      .join("\n");

    message += `\n\n⚠️ Beberapa node masih perlu kredensial:\n${missingSummary}\n\nLengkapi di aplikasi (menu <u>Credentials</u>), lalu publikasikan workflow.`;
  } else {
    message += `\n\n🔌 Semua kredensial sudah terpasang otomatis. Buka aplikasi untuk meninjau & mempublikasikan.`;
  }

  await reply(message);
}

/** Mencari workflow milik pemilik berdasarkan nama (cocok persis lalu sebagian). */
async function findWorkflowByName(
  ownerId: string,
  workflowName: string,
): Promise<{ id: string; name: string } | null> {
  const target = workflowName.trim().toLowerCase();

  if (!target) {
    return null;
  }

  const workflows = await prisma.workflow.findMany({
    where: { ownerId },
    select: { id: true, name: true },
  });

  const exact = workflows.find(
    (workflow) => workflow.name.toLowerCase() === target,
  );

  if (exact) {
    return exact;
  }

  return (
    workflows.find((workflow) =>
      workflow.name.toLowerCase().includes(target),
    ) ?? null
  );
}

/** Memuat node lengkap satu workflow milik pemilik berdasarkan nama. */
async function loadWorkflowDetail(
  ownerId: string,
  workflowName: string,
): Promise<{ name: string; isPublished: boolean; nodes: FlowNode[] } | null> {
  const found = await findWorkflowByName(ownerId, workflowName);

  if (!found) {
    return null;
  }

  const workflow = await prisma.workflow.findFirst({
    where: { id: found.id, ownerId },
  });

  if (!workflow) {
    return null;
  }

  return {
    name: workflow.name,
    isPublished: workflow.isPublished,
    nodes: JSON.parse(workflow.nodes || "[]") as FlowNode[],
  };
}

/** Menyusun penjelasan satu node (kind, fungsi, config) dalam HTML Telegram. */
function describeNode(node: FlowNode): string {
  const def = getNodeTypeDef(node.data.kind as NodeKind);

  const description = def?.description ?? "Node tanpa deskripsi.";

  const config = node.data.config ?? {};
  const configKeys = Object.keys(config);

  const configLine =
    configKeys.length > 0
      ? configKeys
          .map(
            (configKey) =>
              `   • ${escapeHtml(configKey)}: ${escapeHtml(
                String(config[configKey]),
              )}`,
          )
          .join("\n")
      : "   • (belum dikonfigurasi)";

  const credentialLine = def?.credentialType
    ? `\n🔌 Kredensial: <i>${escapeHtml(def.credentialType)}</i>`
    : "";

  return [
    `🧩 <b>${escapeHtml(node.data.label)}</b>`,
    `<i>${escapeHtml(description)}</i>`,
    `⚙️ Konfigurasi:`,
    configLine + credentialLine,
  ].join("\n");
}

/**
 * Mengubah status publikasi workflow LANGSUNG di database tanpa memanggil
 * Gemini. Dipakai untuk intent `publish` agar cepat dan tidak terdampak
 * high-traffic (penyebab error 503 saat sebelumnya lewat builder).
 */
async function setWorkflowPublished(
  ownerId: string,
  workflowId: string,
  workflowName: string,
  publishState: boolean,
  reply: AgentTransport["reply"],
): Promise<{ action: string }> {
  try {
    await prisma.workflow.update({
      where: { id: workflowId },
      data: { isPublished: publishState },
    });

    await invalidateKeys(
      cacheKeys.workflowDetail(workflowId),
      cacheKeys.workflowList(ownerId),
    );

    await publishWorkflowUpdate(ownerId, {
      action: "updated",
      workflowId,
    });

    if (publishState) {
      await reply(
        [
          `🟢 Siap! Workflow <b>${escapeHtml(workflowName)}</b> sekarang berstatus <b>AKTIF</b>. 🎉`,
          "",
          "Mulai sekarang otomasi ini akan berjalan otomatis setiap pemicunya terpenuhi:",
          "• Pemicu terjadwal akan jalan sesuai waktunya.",
          "• Pemicu pesan/Webhook akan merespons begitu ada data masuk.",
          "",
          `💡 Ingin menonaktifkan sementara? Cukup kirim <i>"jadikan draft ${escapeHtml(
            workflowName,
          )}"</i>. Ada lagi yang bisa saya bantu?`,
        ].join("\n"),
      );
    } else {
      await reply(
        [
          `⚪ Oke, workflow <b>${escapeHtml(workflowName)}</b> sudah kembali ke status <b>DRAFT</b>.`,
          "",
          "Saat berstatus draft, otomasi <b>tidak</b> akan berjalan otomatis, jadi aman untuk Anda sunting dulu.",
          "",
          `💡 Kalau sudah siap mengaktifkannya lagi, kirim <i>"publikasikan ${escapeHtml(
            workflowName,
          )}"</i>. Mau saya bantu yang lain?`,
        ].join("\n"),
      );
    }
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "kesalahan tak dikenal";

    await reply(
      `Maaf, gagal mengubah status workflow <b>${escapeHtml(
        workflowName,
      )}</b>: ${escapeHtml(reason)}.`,
    );
  }

  return { action: "publish_done" };
}

/**
 * Menjalankan aksi yang sudah dikonfirmasi pengguna ("ya"): membuat, mengubah,
 * atau menghapus workflow. Semua kegagalan dibalas dengan pesan ramah.
 */
async function runPendingAction(
  pending: PendingState,
  ownerId: string,
  geminiApiKey: string,
  geminiModel: string,
  reply: AgentTransport["reply"],
): Promise<{ action: string }> {
  if (pending.type === "delete") {
    if (!pending.workflowId) {
      await reply("Maaf, workflow yang ingin dihapus tidak dikenali lagi.");

      return { action: "delete_failed" };
    }

    try {
      await prisma.workflow.delete({ where: { id: pending.workflowId } });

      await invalidateKeys(
        cacheKeys.workflowDetail(pending.workflowId),
        cacheKeys.workflowList(ownerId),
      );

      await publishWorkflowUpdate(ownerId, {
        action: "deleted",
        workflowId: pending.workflowId,
      });

      await reply(
        `🗑️ Workflow <b>${escapeHtml(
          pending.workflowName ?? "",
        )}</b> berhasil dihapus.`,
      );
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "kesalahan tak dikenal";

      await reply(`Gagal menghapus workflow: ${escapeHtml(reason)}.`);
    }

    return { action: "delete_confirmed" };
  }

  /** create & edit memakai pembangun yang sama. */
  try {
    await buildAndReply(
      ownerId,
      pending.prompt ?? "",
      geminiApiKey,
      geminiModel,
      reply,
      pending.type === "edit" ? pending.workflowId : undefined,
    );
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "kesalahan tak dikenal";

    await reply(
      `Maaf, otomasi gagal ${
        pending.type === "edit" ? "diubah" : "dibuat"
      }: ${escapeHtml(reason)}. Coba jelaskan ulang dengan lebih spesifik.`,
    );
  }

  return { action: `${pending.type}_confirmed` };
}

/**
 * Titik masuk router agen. Mengembalikan ringkasan tindakan untuk logging.
 */
export async function handleAgentMessage(
  args: AgentRouterArgs,
): Promise<{ action: string }> {
  const { ownerId, sender, message, geminiApiKey, transport } = args;
  const geminiModel = args.geminiModel || GEMINI_MODEL;

  /**
   * Tampilkan indikator "sedang mengetik" secepatnya agar pengguna tahu pesan
   * sedang diproses.
   */
  await transport.sendTyping();

  const redis = await getRedisClient();
  const key = pendingKey(ownerId, sender);
  const pendingRaw = await redis.get(key);

  const normalized = message.trim().toLowerCase();

  /** Tahap konfirmasi: ada aksi yang menunggu jawaban ya/batal. */
  if (pendingRaw) {
    let pending: PendingState | null = null;

    try {
      pending = JSON.parse(pendingRaw) as PendingState;
    } catch {
      pending = null;
    }

    if (pending && CONFIRM_WORDS.includes(normalized)) {
      await redis.del(key);

      return runPendingAction(
        pending,
        ownerId,
        geminiApiKey,
        geminiModel,
        transport.reply,
      );
    }

    if (pending && CANCEL_WORDS.includes(normalized)) {
      await redis.del(key);

      await transport.reply("👍 Baik, aksi dibatalkan.");

      return { action: "action_cancelled" };
    }

    /** Jawaban lain dianggap permintaan baru — hapus state lama. */
    await redis.del(key);
  }

  const workflows = await loadWorkflowContext(ownerId);

  let intentResult;

  try {
    intentResult = await classifyIntent(
      message,
      workflows,
      geminiApiKey,
      geminiModel,
    );
  } catch (error) {
    console.error("[agent] classifyIntent gagal:", error);

    await transport.reply(
      "Maaf, saya sedang kesulitan memproses pesan itu. Coba ulangi sebentar lagi.",
    );

    return { action: "classify_failed" };
  }

  if (
    intentResult.intent === "question" ||
    intentResult.intent === "out_of_scope"
  ) {
    await transport.reply(
      intentResult.answer ??
        "Saya hanya bisa membantu seputar otomasi dan workflow di aplikasi ini.",
    );

    return { action: intentResult.intent };
  }

  if (intentResult.intent === "list") {
    if (workflows.length === 0) {
      await transport.reply(
        '📭 Anda belum punya workflow. Kirim <i>"buatkan otomasi ..."</i> untuk membuat yang pertama.',
      );

      return { action: "list" };
    }

    const lines = workflows
      .map((workflow) => {
        const status = workflow.isPublished ? "🟢 aktif" : "⚪ draft";

        return `• <b>${escapeHtml(workflow.name)}</b> — ${status}, ${workflow.nodeCount} node`;
      })
      .join("\n");

    await transport.reply(`📋 <b>Daftar workflow Anda:</b>\n${lines}`);

    return { action: "list" };
  }

  if (intentResult.intent === "explain") {
    const detail = await loadWorkflowDetail(
      ownerId,
      intentResult.workflowName ?? "",
    );

    if (!detail) {
      await transport.reply(
        `🔍 Workflow <b>${escapeHtml(
          intentResult.workflowName ?? "",
        )}</b> tidak ditemukan. Coba sebutkan nama yang sesuai.`,
      );

      return { action: "explain_not_found" };
    }

    /** Penjelasan satu node tertentu bila disebutkan. */
    if (intentResult.nodeName) {
      const target = intentResult.nodeName.trim().toLowerCase();

      const node =
        detail.nodes.find((item) => item.data.label.toLowerCase() === target) ??
        detail.nodes.find((item) =>
          item.data.label.toLowerCase().includes(target),
        ) ??
        detail.nodes.find((item) => item.data.kind.includes(target));

      if (!node) {
        await transport.reply(
          `🔍 Node <b>${escapeHtml(
            intentResult.nodeName,
          )}</b> tidak ditemukan di workflow <b>${escapeHtml(detail.name)}</b>.`,
        );

        return { action: "explain_node_not_found" };
      }

      await transport.reply(describeNode(node));

      return { action: "explain_node" };
    }

    /** Penjelasan seluruh node + urutannya. */
    const status = detail.isPublished ? "🟢 aktif" : "⚪ draft";

    const nodeList = detail.nodes
      .map((node, index) => {
        const def = getNodeTypeDef(node.data.kind as NodeKind);

        return `${index + 1}. <b>${escapeHtml(node.data.label)}</b> — <i>${escapeHtml(
          def?.description ?? node.data.kind,
        )}</i>`;
      })
      .join("\n");

    await transport.reply(
      `📖 Workflow <b>${escapeHtml(detail.name)}</b> (${status}) punya <b>${detail.nodes.length} node</b>:\n${nodeList}\n\n💡 Ketik <i>"jelaskan node [nama]"</i> untuk detail satu node.`,
    );

    return { action: "explain" };
  }

  if (intentResult.intent === "create") {
    const pending: PendingState = { type: "create", prompt: message };

    await redis.setEx(key, PENDING_TTL_SECONDS, JSON.stringify(pending));

    const plan =
      intentResult.planSummary ??
      "Saya akan membuat workflow sesuai permintaan Anda.";

    await transport.reply(
      `🛠️ <b>Rencana otomasi:</b>\n${plan}\n\nApakah Anda ingin saya membuatnya sekarang? Tekan tombol di bawah ini.`,
      CONFIRM_BUTTONS,
    );

    return { action: "create_proposed" };
  }

  if (intentResult.intent === "edit") {
    const workflow = await findWorkflowByName(
      ownerId,
      intentResult.workflowName ?? "",
    );

    if (!workflow) {
      await transport.reply(
        `🔍 Workflow <b>${escapeHtml(
          intentResult.workflowName ?? "",
        )}</b> tidak ditemukan untuk diubah.`,
      );

      return { action: "edit_not_found" };
    }

    const pending: PendingState = {
      type: "edit",
      prompt: intentResult.editInstruction ?? message,
      workflowId: workflow.id,
      workflowName: workflow.name,
    };

    await redis.setEx(key, PENDING_TTL_SECONDS, JSON.stringify(pending));

    await transport.reply(
      `✏️ Saya akan mengubah workflow <b>${escapeHtml(
        workflow.name,
      )}</b>:\n${escapeHtml(
        intentResult.editInstruction ?? message,
      )}\n\nLanjutkan perubahan ini? Tekan tombol di bawah ini.`,
      CONFIRM_BUTTONS,
    );

    return { action: "edit_proposed" };
  }

  if (intentResult.intent === "delete") {
    const workflow = await findWorkflowByName(
      ownerId,
      intentResult.workflowName ?? "",
    );

    if (!workflow) {
      await transport.reply(
        `🔍 Workflow <b>${escapeHtml(
          intentResult.workflowName ?? "",
        )}</b> tidak ditemukan untuk dihapus.`,
      );

      return { action: "delete_not_found" };
    }

    const pending: PendingState = {
      type: "delete",
      workflowId: workflow.id,
      workflowName: workflow.name,
    };

    await redis.setEx(key, PENDING_TTL_SECONDS, JSON.stringify(pending));

    await transport.reply(
      `⚠️ Yakin ingin <b>menghapus</b> workflow <b>${escapeHtml(
        workflow.name,
      )}</b>? Tindakan ini tidak bisa dibatalkan.\n\nTekan tombol di bawah ini untuk memastikan.`,
      CONFIRM_BUTTONS,
    );

    return { action: "delete_proposed" };
  }

  if (intentResult.intent === "publish") {
    const workflow = await findWorkflowByName(
      ownerId,
      intentResult.workflowName ?? "",
    );

    if (!workflow) {
      await transport.reply(
        `🔍 Workflow <b>${escapeHtml(
          intentResult.workflowName ?? "",
        )}</b> tidak ditemukan. Coba sebutkan nama yang sesuai dengan daftar workflow Anda.`,
      );

      return { action: "publish_not_found" };
    }

    const publishState = intentResult.publishState !== false;

    return setWorkflowPublished(
      ownerId,
      workflow.id,
      workflow.name,
      publishState,
      transport.reply,
    );
  }

  if (intentResult.intent === "run") {
    const workflow = await findWorkflowByName(
      ownerId,
      intentResult.workflowName ?? "",
    );

    if (!workflow) {
      await transport.reply(
        `🔍 Workflow <b>${escapeHtml(
          intentResult.workflowName ?? "",
        )}</b> tidak ditemukan. Sebutkan nama yang sesuai dengan daftar workflow Anda.`,
      );

      return { action: "run_not_found" };
    }

    try {
      await runWorkflow(workflow.id, { sender, message }, "main");

      await transport.reply(
        `▶️ Workflow <b>${escapeHtml(workflow.name)}</b> sedang dijalankan.`,
      );
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "kesalahan tak dikenal";

      await transport.reply(
        `Gagal menjalankan <b>${escapeHtml(workflow.name)}</b>: ${escapeHtml(
          reason,
        )}.`,
      );
    }

    return { action: "run_triggered" };
  }

  return { action: "noop" };
}
