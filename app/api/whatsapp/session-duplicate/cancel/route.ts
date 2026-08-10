import { handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

/** Membatalkan sesi baru yang memiliki nomor WhatsApp duplikat. */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { sessionId } = (await request.json()) as { sessionId?: string };

    if (!sessionId) {
      throw new Error("Session ID wajib diisi");
    }

    await whatsappSessionService.cancelDuplicate(user.id, sessionId);

    return ok({ cancelled: true }, "Pemindahan nomor dibatalkan");
  });
}
