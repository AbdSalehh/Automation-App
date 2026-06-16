import { prisma } from "@/shared/lib/prisma";
import { getRedisClient } from "@/shared/lib/redis";
import { GEMINI_MODEL } from "@/shared/config/constants";
import { runWorkflow } from "@/shared/server/engine";
import { buildWorkflowFromPrompt } from "@/shared/server/workflowBuilder";
import type { FlowNode } from "@/entities/workflow/model/workflow.model";
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

/** Adaptor pengiriman pesan untuk channel chat tertentu. */
export interface AgentTransport {
  /** Mengirim balasan teks ke pengirim. */
  reply: (text: string) => Promise<void>;
  /** Menampilkan indikator "sedang mengetik" (opsional, boleh no-op). */
  sendTyping: () => Promise<void>;
}

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
      name: workflow.name,
      isPublished: workflow.isPublished,
      nodeCount: nodes.length,
      nodeKinds: nodes.map((node) => node.data.kind),
    };
  });
}

/**
 * Membangun & menyimpan workflow dari prompt tertunda, lalu membalas hasil
 * beserta daftar node yang masih memerlukan kredensial.
 */
async function buildAndReply(
  ownerId: string,
  prompt: string,
  geminiApiKey: string,
  geminiModel: string,
  reply: AgentTransport["reply"],
): Promise<void> {
  const built = await buildWorkflowFromPrompt(
    prompt,
    geminiApiKey,
    ownerId,
    geminiModel,
  );

  const created = await prisma.workflow.create({
    data: {
      name: built.name,
      ownerId,
      nodes: JSON.stringify(built.nodes),
      edges: JSON.stringify(built.edges),
      isPublished: false,
    },
  });

  const nodeSummary = built.nodes
    .map((node) => `• ${node.data.label}`)
    .join("\n");

  let message = `Otomasi "${built.name}" sudah dibuat dengan ${built.nodes.length} langkah:\n${nodeSummary}`;

  if (built.missingCredentials.length > 0) {
    const missingSummary = built.missingCredentials
      .map(
        (missing) =>
          `• ${missing.nodeLabel} (perlu kredensial ${missing.credentialType})`,
      )
      .join("\n");

    message += `\n\nBeberapa node masih perlu kredensial sebelum bisa dijalankan:\n${missingSummary}\n\nLengkapi di aplikasi (menu Credentials), lalu publikasikan workflow.`;
  } else {
    message += `\n\nSemua kredensial sudah terpasang otomatis. Buka aplikasi untuk meninjau & mempublikasikan (ID: ${created.id}).`;
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
  const pendingPrompt = await redis.get(key);

  const normalized = message.trim().toLowerCase();

  /** Tahap konfirmasi: ada rencana yang menunggu jawaban ya/batal. */
  if (pendingPrompt) {
    if (CONFIRM_WORDS.includes(normalized)) {
      await redis.del(key);

      try {
        await buildAndReply(
          ownerId,
          pendingPrompt,
          geminiApiKey,
          geminiModel,
          transport.reply,
        );
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "kesalahan tak dikenal";

        await transport.reply(
          `Maaf, otomasi gagal dibuat: ${reason}. Coba jelaskan ulang dengan lebih spesifik.`,
        );
      }

      return { action: "create_confirmed" };
    }

    if (CANCEL_WORDS.includes(normalized)) {
      await redis.del(key);

      await transport.reply("Baik, pembuatan otomasi dibatalkan.");

      return { action: "create_cancelled" };
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

  if (intentResult.intent === "create") {
    await redis.setEx(key, PENDING_TTL_SECONDS, message);

    const plan =
      intentResult.planSummary ??
      "Saya akan membuat workflow sesuai permintaan Anda.";

    await transport.reply(
      `Rencana otomasi:\n${plan}\n\nBalas "ya" untuk membuat, atau "batal" untuk membatalkan.`,
    );

    return { action: "create_proposed" };
  }

  if (intentResult.intent === "run") {
    const workflow = await findWorkflowByName(
      ownerId,
      intentResult.workflowName ?? "",
    );

    if (!workflow) {
      await transport.reply(
        `Workflow "${intentResult.workflowName ?? ""}" tidak ditemukan. Sebutkan nama yang sesuai dengan daftar workflow Anda.`,
      );

      return { action: "run_not_found" };
    }

    try {
      await runWorkflow(workflow.id, { sender, message }, "main");

      await transport.reply(`Workflow "${workflow.name}" sedang dijalankan.`);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "kesalahan tak dikenal";

      await transport.reply(`Gagal menjalankan "${workflow.name}": ${reason}.`);
    }

    return { action: "run_triggered" };
  }

  return { action: "noop" };
}
