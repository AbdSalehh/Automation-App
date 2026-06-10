import { prisma } from "@/shared/lib/prisma";
import { handleRoute, ok } from "@/shared/api/http";
import { runWorkflow } from "@/shared/server/engine";
import type { FlowNode } from "@/entities/workflow/model/workflow.model";

/**
 * Incoming WhatsApp message webhook (Whapi).
 *
 * Configure this URL in the Whapi panel under Channel → Webhooks (messages).
 * Whapi POSTs a payload like:
 *   { messages: [{ from, from_name, chat_id, text: { body }, ... }], ... }
 *
 * For every published workflow that contains a `whatsapp_whapi_trigger` node,
 * we run it with the normalised reply as the trigger payload so downstream
 * nodes can use {{sender}}, {{message}}, {{name}} and write the reply back to
 * a sheet.
 *
 * Unauthenticated by design (mirrors the Fonnte webhook); the payload is
 * treated as untrusted data.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    let raw: Record<string, unknown> = {};

    try {
      raw = (await request.json()) as Record<string, unknown>;
    } catch {
      raw = {};
    }

    /**
     * Whapi delivers an array of message events. We must filter out
     * messages sent by the bot itself (from_me === true) to prevent
     * an infinite loop where the bot's own replies re-trigger this
     * webhook endlessly.
     */
    const allMessages = Array.isArray(raw.messages)
      ? (raw.messages as Array<Record<string, unknown>>)
      : [];

    const inboundMessages = allMessages.filter(
      (messageItem) => messageItem.from_me !== true,
    );

    if (inboundMessages.length === 0) {
      return ok(
        { triggered: [], count: 0 },
        "Pesan keluar (from_me) diabaikan",
      );
    }

    const firstMessage = inboundMessages[0] ?? {};

    const textValue = firstMessage.text as { body?: string } | undefined;

    const payload = {
      sender: String(firstMessage.from ?? firstMessage.chat_id ?? ""),
      message: String(textValue?.body ?? firstMessage.body ?? ""),
      name: String(firstMessage.from_name ?? ""),
      chatId: String(firstMessage.chat_id ?? ""),
      receivedAt: new Date().toISOString(),
      raw,
    };

    const publishedWorkflows = await prisma.workflow.findMany({
      where: { isPublished: true },
    });

    const triggered: string[] = [];

    for (const workflow of publishedWorkflows) {
      const nodes: FlowNode[] = JSON.parse(workflow.nodes || "[]");

      const hasReplyTrigger = nodes.some(
        (node) => node.data.kind === "whatsapp_whapi_trigger",
      );

      if (!hasReplyTrigger) {
        continue;
      }

      const executionId = await runWorkflow(workflow.id, payload);
      triggered.push(executionId);
    }

    return ok(
      { triggered, count: triggered.length },
      "Balasan WhatsApp Whapi diterima",
    );
  });
}

/** Whapi may probe the endpoint with GET — respond OK. */
export async function GET() {
  return handleRoute(async () => ok({ ok: true }, "Webhook Whapi aktif"));
}
