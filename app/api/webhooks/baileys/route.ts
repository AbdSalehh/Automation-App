import { prisma } from "@/shared/lib/prisma";
import { handleRoute, ok, badRequest } from "@/shared/api/http";
import { runWorkflow, resumeWaitingReplies } from "@/shared/server/engine";
import { handleAgentMessage } from "@/shared/server/agent/agentRouter";
import { parseSessionId } from "@/shared/server/whatsapp/sessions";
import { decryptWebhookJson } from "@/shared/lib/webhookCrypto";
import type { FlowNode } from "@/entities/workflow/model/workflow.model";

/**
 * Webhook pesan masuk dari WhatsApp API Service (Express + Baileys) multi-session.
 *
 * Express meneruskan tiap pesan masuk ke endpoint ini. Format baru (disarankan)
 * mengirim satu field `payload` berisi token terenkripsi (AES-256-GCM) yang
 * berisi `{ sessionId, sender, message, name?, ... }`, dengan `sender` sudah
 * berupa nomor telepon asli (LID sudah diresolusi di backend). Format lama
 * (field plaintext) tetap didukung sebagai fallback.
 *
 * `sessionId` menandakan akun (user) mana yang menerima pesan. Hanya workflow
 * milik user tersebut yang dilanjutkan/dipicu, sehingga balasan satu user tidak
 * salah memicu workflow user lain. Payload diperlakukan sebagai data tak
 * tepercaya (tanpa auth header).
 */
interface BaileysWebhookPayload {
  sessionId?: string;
  sender?: string;
  message?: string;
  name?: string;
  sentAt?: string;
  receivedAt?: string;
  /** Token terenkripsi berisi field di atas (format baru). */
  payload?: string;
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    let raw: BaileysWebhookPayload;

    try {
      raw = (await request.json()) as BaileysWebhookPayload;
    } catch {
      return badRequest("Body bukan JSON yang valid");
    }

    /**
     * Format baru: payload terenkripsi. Di-decrypt memakai kunci bersama
     * `WEBHOOK_ENCRYPTION_KEY`. Bila gagal, anggap body tidak sah.
     */
    let source: BaileysWebhookPayload = raw;

    if (raw.payload) {
      try {
        source = decryptWebhookJson<BaileysWebhookPayload>(raw.payload);
      } catch {
        return badRequest("Payload terenkripsi tidak dapat di-decrypt");
      }
    }

    if (!source.sessionId || !source.sender || !source.message) {
      return badRequest(
        "Payload tidak lengkap: sessionId, sender, dan message wajib diisi",
      );
    }

    const payload = {
      sessionId: String(source.sessionId),
      sender: String(source.sender),
      message: String(source.message),
      name: String(source.name ?? ""),
      sentAt: source.sentAt ?? "",
      receivedAt: source.receivedAt ?? new Date().toISOString(),
    };

    const { ownerId, channel } = parseSessionId(payload.sessionId);

    /**
     * Akun agen: seluruh pesan masuk diproses router Gemini (tanya/buat/
     * jalankan/di luar konteks). Tidak memicu workflow secara langsung.
     */
    if (channel === "agent") {
      const result = await handleAgentMessage({
        ownerId,
        sender: payload.sender,
        message: payload.message,
      });

      return ok(result, "Pesan agen diproses");
    }

    /**
     * Akun workflow: jalur klasik. Lanjutkan wait_reply yang menunggu balasan
     * pengirim ini, lalu picu workflow milik pemilik yang punya whatsapp_trigger.
     */
    const resumedCount = await resumeWaitingReplies(payload.sender, payload);

    const publishedWorkflows = await prisma.workflow.findMany({
      where: { isPublished: true, ownerId },
    });

    const triggered: string[] = [];

    for (const workflow of publishedWorkflows) {
      const nodes: FlowNode[] = JSON.parse(workflow.nodes || "[]");

      const hasReplyTrigger = nodes.some(
        (node) => node.data.kind === "whatsapp_trigger",
      );

      if (!hasReplyTrigger) {
        continue;
      }

      const executionId = await runWorkflow(workflow.id, payload, "reply");
      triggered.push(executionId);
    }

    return ok(
      { triggered, count: triggered.length, resumed: resumedCount },
      "Pesan masuk Baileys diterima",
    );
  });
}
