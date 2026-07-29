import { badRequest, forbidden, handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

interface RouteParams {
  params: Promise<{ jid: string }>;
}

/**
 * Menghapus cache percakapan dari sesi yang dipilih admin.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
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

    await whatsappSessionService.clearConversationCache(sessionId, jid);

    return ok({ deleted: true }, "Cache percakapan berhasil dihapus");
  });
}
