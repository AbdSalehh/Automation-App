import { badRequest, forbidden, handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

/**
 * Mengambil percakapan untuk sesi WhatsApp yang dipilih admin.
 */
export async function GET(request: Request) {
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

    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "15", 10) || 15),
    );
    const offset = Math.min(
      10000,
      Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0),
    );

    const { data, metadata } = await whatsappSessionService.listConversations(
      sessionId,
      { limit, offset },
    );

    return ok(
      { conversations: data, metadata },
      "Daftar percakapan berhasil diambil",
    );
  });
}
