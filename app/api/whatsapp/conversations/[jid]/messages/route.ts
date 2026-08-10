import { badRequest, forbidden, handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

interface RouteParams {
  params: Promise<{ jid: string }>;
}

/**
 * Mengambil pesan dari percakapan dan sesi yang dipilih admin.
 */
export async function GET(request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();

    if (user.role !== "admin") {
      return forbidden();
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId")?.trim();

    if (!sessionId) {
      return badRequest("Session ID wajib diisi");
    }

    const { jid: encodedJid } = await params;
    let jid: string;

    try {
      jid = decodeURIComponent(encodedJid);
    } catch {
      return badRequest("JID tidak valid");
    }

    if (!jid) {
      return badRequest("JID tidak valid");
    }

    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50),
    );
    const offset = Math.min(
      100000,
      Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0),
    );

    const { data, metadata } = await whatsappSessionService.listMessages(
      user.id,
      sessionId,
      jid,
      { limit, offset },
    );

    return ok({ messages: data, metadata }, "Riwayat pesan berhasil diambil");
  });
}
