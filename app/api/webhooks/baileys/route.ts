import { prisma } from "@/shared/lib/prisma";
import { handleRoute, ok, badRequest } from "@/shared/api/http";
import { runWorkflow, resumeWaitingReplies } from "@/shared/server/engine";
import type { FlowNode } from "@/entities/workflow/model/workflow.model";

/**
 * Webhook pesan masuk dari WhatsApp API Service (Express + Baileys) multi-session.
 *
 * Express meneruskan tiap pesan masuk ke endpoint ini dengan payload:
 *   { sessionId, sender, message, name?, receivedAt? }
 *
 * `sessionId` menandakan akun (user) mana yang menerima pesan. Hanya workflow
 * milik user tersebut yang dilanjutkan/dipicu, sehingga balasan satu user tidak
 * salah memicu workflow user lain. Payload diperlakukan sebagai data tak
 * tepercaya (tanpa auth header).
 */
interface BaileysWebhookPayload {
  sessionId: string;
  sender: string;
  message: string;
  name?: string;
  sentAt?: string;
  receivedAt?: string;
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    let raw: BaileysWebhookPayload;

    try {
      raw = (await request.json()) as BaileysWebhookPayload;
    } catch {
      return badRequest("Body bukan JSON yang valid");
    }

    if (!raw.sessionId || !raw.sender || !raw.message) {
      return badRequest(
        "Payload tidak lengkap: sessionId, sender, dan message wajib diisi",
      );
    }

    const payload = {
      sessionId: String(raw.sessionId),
      sender: String(raw.sender),
      message: String(raw.message),
      name: String(raw.name ?? ""),
      sentAt: raw.sentAt ?? "",
      receivedAt: raw.receivedAt ?? new Date().toISOString(),
    };

    /** Lanjutkan eksekusi wait_reply yang menunggu balasan dari pengirim ini. */
    const resumedCount = await resumeWaitingReplies(payload.sender, payload);

    /**
     * Hanya workflow milik pemilik sesi (ownerId === sessionId) yang boleh
     * dipicu oleh balasan ini.
     */
    const publishedWorkflows = await prisma.workflow.findMany({
      where: { isPublished: true, ownerId: payload.sessionId },
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
