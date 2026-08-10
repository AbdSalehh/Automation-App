import { handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

/** Mengonfirmasi pemindahan nomor duplikat untuk sesi pengguna aktif. */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { sessionId } = (await request.json()) as { sessionId?: string };

    if (!sessionId) {
      throw new Error("Session ID wajib diisi");
    }

    await whatsappSessionService.confirmDuplicate(user.id, sessionId);

    return ok({ confirmed: true }, "Pemindahan nomor berhasil dikonfirmasi");
  });
}
