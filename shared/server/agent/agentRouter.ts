import { prisma } from "@/shared/lib/prisma";
import { getRedisClient } from "@/shared/lib/redis";
import { baileysClient } from "@/shared/api/baileysClient";
import { runWorkflow } from "@/shared/server/engine";
import { buildWorkflowFromPrompt } from "@/shared/server/workflowBuilder";
import { agentSessionId } from "@/shared/server/whatsapp/sessions";
import type { FlowNode } from "@/entities/workflow/model/workflow.model";
import {
  classifyIntent,
  loadOwnerGeminiKey,
  type WorkflowContext,
} from "./intentClassifier";

/**
 * Router agen WhatsApp (chat-action).
 *
 * Memproses pesan masuk ke akun agen: mendeteksi konfirmasi pembuatan yang
 * tertunda, lalu mengklasifikasi maksud lewat Gemini dan menjalankan tindakan
 * (jawab pertanyaan / buat workflow / jalankan workflow / tolak di luar konteks).
 *
 * Server-only module.
 */

export interface AgentRouterArgs {
  ownerId: string;
  /** Nomor pengirim, dipakai untuk membalas via akun agen. */
  sender: string;
  message: string;
}

/** TTL state konfirmasi pembuatan (10 menit). */
const PENDING_TTL_SECONDS = 600;

/** Kata yang dianggap konfirmasi setuju / batal. */
const CONFIRM_WORDS = ["ya", "iya", "lanjut", "setuju", "ok", "oke", "yes"];
const CANCEL_WORDS = ["batal", "tidak", "ga", "gak", "no", "cancel"];

function pendingKey(ownerId: string, sender: string): string {
  return `agent-pending:${ownerId}:${sender}`;
}

/** Mengirim balasan teks ke pengirim melalui akun agen (channel agent). */
async function replyViaAgent(
  ownerId: string,
  sender: string,
  text: string,
): Promise<void> {
  const cleanTarget = sender.includes("@") ? sender : sender.replace(/\D/g, "");

  try {
    await baileysClient.post(
      `/sessions/${agentSessionId(ownerId)}/send-message`,
      {
        target: cleanTarget,
        message: text,
      },
    );
  } catch {
    /** Kegagalan balasan tidak boleh menggagalkan pemrosesan pesan. */
  }
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
  sender: string,
  prompt: string,
  geminiApiKey: string,
): Promise<void> {
  const built = await buildWorkflowFromPrompt(prompt, geminiApiKey, ownerId);

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

  let reply = `Otomasi "${built.name}" sudah dibuat dengan ${built.nodes.length} langkah:\n${nodeSummary}`;

  if (built.missingCredentials.length > 0) {
    const missingSummary = built.missingCredentials
      .map(
        (missing) =>
          `• ${missing.nodeLabel} (perlu kredensial ${missing.credentialType})`,
      )
      .join("\n");

    reply += `\n\nBeberapa node masih perlu kredensial sebelum bisa dijalankan:\n${missingSummary}\n\nLengkapi di aplikasi (menu Credentials), lalu publikasikan workflow.`;
  } else {
    reply += `\n\nSemua kredensial sudah terpasang otomatis. Buka aplikasi untuk meninjau & mempublikasikan (ID: ${created.id}).`;
  }

  await replyViaAgent(ownerId, sender, reply);
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
  const { ownerId, sender, message } = args;

  const geminiApiKey = await loadOwnerGeminiKey(ownerId);

  if (!geminiApiKey) {
    await replyViaAgent(
      ownerId,
      sender,
      "Agen AI belum aktif. Tambahkan kredensial Google Gemini di aplikasi (menu Credentials) terlebih dahulu.",
    );

    return { action: "no_gemini" };
  }

  const redis = await getRedisClient();
  const key = pendingKey(ownerId, sender);
  const pendingPrompt = await redis.get(key);

  const normalized = message.trim().toLowerCase();

  /** Tahap konfirmasi: ada rencana yang menunggu jawaban ya/batal. */
  if (pendingPrompt) {
    if (CONFIRM_WORDS.includes(normalized)) {
      await redis.del(key);

      try {
        await buildAndReply(ownerId, sender, pendingPrompt, geminiApiKey);
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "kesalahan tak dikenal";

        await replyViaAgent(
          ownerId,
          sender,
          `Maaf, otomasi gagal dibuat: ${reason}. Coba jelaskan ulang dengan lebih spesifik.`,
        );
      }

      return { action: "create_confirmed" };
    }

    if (CANCEL_WORDS.includes(normalized)) {
      await redis.del(key);

      await replyViaAgent(
        ownerId,
        sender,
        "Baik, pembuatan otomasi dibatalkan.",
      );

      return { action: "create_cancelled" };
    }

    /** Jawaban lain dianggap permintaan baru — hapus state lama. */
    await redis.del(key);
  }

  const workflows = await loadWorkflowContext(ownerId);

  let intentResult;

  try {
    intentResult = await classifyIntent(message, workflows, geminiApiKey);
  } catch (error) {
    console.error("[agent] classifyIntent gagal:", error);

    await replyViaAgent(
      ownerId,
      sender,
      "Maaf, saya sedang kesulitan memproses pesan itu. Coba ulangi sebentar lagi.",
    );

    return { action: "classify_failed" };
  }

  if (
    intentResult.intent === "question" ||
    intentResult.intent === "out_of_scope"
  ) {
    await replyViaAgent(
      ownerId,
      sender,
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

    await replyViaAgent(
      ownerId,
      sender,
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
      await replyViaAgent(
        ownerId,
        sender,
        `Workflow "${intentResult.workflowName ?? ""}" tidak ditemukan. Sebutkan nama yang sesuai dengan daftar workflow Anda.`,
      );

      return { action: "run_not_found" };
    }

    try {
      await runWorkflow(workflow.id, { sender, message }, "main");

      await replyViaAgent(
        ownerId,
        sender,
        `Workflow "${workflow.name}" sedang dijalankan.`,
      );
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "kesalahan tak dikenal";

      await replyViaAgent(
        ownerId,
        sender,
        `Gagal menjalankan "${workflow.name}": ${reason}.`,
      );
    }

    return { action: "run_triggered" };
  }

  return { action: "noop" };
}
