import { handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

/**
 * Proxy aman (BFF) untuk mengambil status sesi WhatsApp dari service Baileys.
 *
 * `sessionId` diturunkan dari user yang sedang login (bukan input browser),
 * sehingga user hanya bisa mengakses sesinya sendiri. Setiap pengguna memiliki
 * satu akun WhatsApp (dipakai node WhatsApp). API Key Baileys hanya dipakai di
 * sisi server lewat `baileysClient` sehingga tidak bocor ke klien.
 */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    const sessions = await whatsappSessionService.listSessions(user.id);
    const existingSession = sessions[0];

    if (existingSession) {
      const session = await whatsappSessionService.getStatus(
        user.id,
        existingSession.sessionId,
      );

      return ok(
        { sessionId: existingSession.sessionId, session },
        "Status sesi berhasil diambil",
      );
    }

    const createdSession = await whatsappSessionService.createSession(user.id);

    return ok(createdSession, "Sesi WhatsApp berhasil dibuat");
  });
}
