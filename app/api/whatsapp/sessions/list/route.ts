import { handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    const sessions = await whatsappSessionService.listSessions(user.id);

    return ok(sessions, "Daftar akun WhatsApp berhasil diambil");
  });
}
