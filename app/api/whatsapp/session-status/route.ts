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
    const resolvedSession = await whatsappSessionService.resolveSession(
      user.id,
    );

    return ok(resolvedSession, "Status sesi berhasil diambil");
  });
}
