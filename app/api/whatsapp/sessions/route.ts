import { handleRoute, created } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

export async function POST() {
  return handleRoute(async () => {
    const user = await requireUser();
    const resolvedSession = await whatsappSessionService.createSession(user.id);

    return created(resolvedSession, "Sesi WhatsApp berhasil dibuat");
  });
}
