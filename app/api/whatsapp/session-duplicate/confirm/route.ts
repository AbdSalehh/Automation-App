import { handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

/** Mengonfirmasi pemindahan nomor duplikat untuk sesi pengguna aktif. */
export async function POST() {
  return handleRoute(async () => {
    const user = await requireUser();

    await whatsappSessionService.confirmDuplicate(user.id);

    return ok({ confirmed: true }, "Pemindahan nomor berhasil dikonfirmasi");
  });
}
