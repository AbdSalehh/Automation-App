import { forbidden, handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

/**
 * Mengambil semua sesi WhatsApp. Endpoint ini hanya dapat diakses admin.
 */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();

    if (user.role !== "admin") {
      return forbidden();
    }

    const sessions = await whatsappSessionService.listAllSessions();

    return ok(sessions, "Daftar seluruh sesi WhatsApp berhasil diambil");
  });
}
