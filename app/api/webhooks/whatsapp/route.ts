import { prisma } from "@/shared/lib/prisma";
import { handleRoute, ok } from "@/shared/api/http";
import { runWorkflow } from "@/shared/server/engine";
import type { FlowNode } from "@/entities/workflow/model/workflow.model";

/**
 * Incoming WhatsApp message webhook (Fonnte).
 *
 * Configure this URL in the Fonnte dashboard under Device → Webhook (incoming
 * message). Fonnte POSTs a payload like:
 *   { device, sender, message, name, ... }
 *
 * For every published workflow that contains a `whatsapp_fonnte_trigger` node,
 * we run it with the normalised reply as the trigger payload so downstream
 * nodes can use {{sender}}, {{message}}, {{name}} and write the reply back to a
 * sheet.
 *
 * Unauthenticated by design (Fonnte can't send custom auth headers); the
 * payload is treated as untrusted data.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    let raw: Record<string, unknown> = {};

    try {
      const contentType = request.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        raw = (await request.json()) as Record<string, unknown>;
      } else {
        const formData = await request.formData();
        formData.forEach((value, key) => {
          raw[key] = value;
        });
      }
    } catch {
      raw = {};
    }

    // Normalise common Fonnte fields into a stable shape.
    const payload = {
      sender: String(raw.sender ?? raw.from ?? ""),
      message: String(raw.message ?? raw.text ?? ""),
      name: String(raw.name ?? raw.pushname ?? ""),
      device: String(raw.device ?? ""),
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
        (node) => node.data.kind === "whatsapp_fonnte_trigger",
      );

      if (!hasReplyTrigger) {
        continue;
      }

      const executionId = await runWorkflow(workflow.id, payload);
      triggered.push(executionId);
    }

    return ok(
      { triggered, count: triggered.length },
      "Balasan WhatsApp diterima",
    );
  });
}

/** Fonnte may probe the endpoint with GET — respond OK. */
export async function GET() {
  return handleRoute(async () => ok({ ok: true }, "Webhook WhatsApp aktif"));
}
