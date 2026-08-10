import { prisma } from "@/shared/lib/prisma";
import { handleRoute, ok, badRequest } from "@/shared/api/http";
import { runWorkflow, resumeWaitingReplies } from "@/shared/server/engine";
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
interface InboundMedia {
  mimetype: string;
  fileName: string;
  fileLength: number;
  url: string;
}

interface SharedLocation {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  url: string;
}

interface SharedContact {
  displayName: string;
  phoneNumber: string;
  contactCount: number;
}

type InboundMessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "sticker"
  | "location"
  | "contact";

type InboundPayload = InboundMedia | SharedLocation | SharedContact;

interface BaileysWebhookPayload {
  sessionId?: string;
  sender?: string;
  message?: string;
  name?: string;
  messageType?: InboundMessageType;
  media?: InboundPayload | null;
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
      return badRequest("Body is not valid JSON");
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
        return badRequest("Encrypted payload could not be decrypted");
      }
    }

    const hasStructuredPayload = Boolean(source.media);

    if (
      !source.sessionId ||
      !source.sender ||
      (!source.message && !hasStructuredPayload)
    ) {
      return badRequest(
        "Incomplete payload: sessionId, sender, and message/media are required",
      );
    }

    const payload = {
      sessionId: String(source.sessionId),
      sender: String(source.sender),
      message: String(source.message ?? ""),
      name: String(source.name ?? ""),
      messageType: source.messageType ?? "text",
      media: source.media ?? null,
      sentAt: source.sentAt ?? "",
      receivedAt: source.receivedAt ?? new Date().toISOString(),
    };

    const ownerId = payload.sessionId;

    /**
     * Lanjutkan wait_reply yang menunggu balasan pengirim ini, lalu picu
     * workflow milik pemilik yang memuat node whatsapp_trigger.
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
      "Incoming Baileys message received",
    );
  });
}
