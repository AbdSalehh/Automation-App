import { handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

/** Membatalkan sesi baru yang memiliki nomor WhatsApp duplikat. */
export async function POST() {
  return handleRoute(async () => {
    const user = await requireUser();

    await whatsappSessionService.cancelDuplicate(user.id);

    return ok({ cancelled: true }, "Pemindahan nomor dibatalkan");
  });
}
