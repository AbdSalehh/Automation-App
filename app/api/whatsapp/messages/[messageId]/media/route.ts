import { badRequest, forbidden, handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

interface RouteParams {
  params: Promise<{ messageId: string }>;
}

/** Format ID yang sama dengan validasi di Baileys, mencegah path traversal. */
const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const SAFE_MESSAGE_ID_PATTERN = /^[A-Za-z0-9._:-]{1,200}$/;

/**
 * Mengunduh media penuh dari WhatsApp untuk pesan yang baru disimpan
 * preview-nya, lalu mengembalikan media dengan URL storage.
 */
export async function POST(request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();

    if (user.role !== "admin") {
      return forbidden();
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId")?.trim() ?? "";
    const ownerId = searchParams.get("ownerId")?.trim() ?? "";
    const { messageId } = await params;

    if (
      !SAFE_ID_PATTERN.test(sessionId) ||
      !ownerId ||
      !SAFE_MESSAGE_ID_PATTERN.test(messageId)
    ) {
      return badRequest("Session ID, owner ID, atau message ID tidak valid");
    }

    const media = await whatsappSessionService.downloadMessageMedia(
      ownerId,
      sessionId,
      messageId,
    );

    return ok(media, "Media berhasil diunduh");
  });
}
