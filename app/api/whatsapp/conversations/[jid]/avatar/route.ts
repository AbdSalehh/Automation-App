import { badRequest, forbidden, handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

interface RouteParams {
  params: Promise<{ jid: string }>;
}

/**
 * Mengambil foto profil (user/grup) on-demand untuk percakapan tertentu.
 */
export async function GET(request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();

    if (user.role !== "admin") {
      return forbidden();
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId")?.trim();
    const ownerId = searchParams.get("ownerId")?.trim();

    if (!sessionId || !ownerId) {
      return badRequest("Session ID dan owner ID wajib diisi");
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

    const avatarUrl = await whatsappSessionService.getConversationAvatar(
      ownerId,
      sessionId,
      jid,
    );

    return ok({ avatarUrl }, "Foto profil berhasil diambil");
  });
}
