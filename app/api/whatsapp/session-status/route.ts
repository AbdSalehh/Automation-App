import { handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

/**
 * Proxy aman (BFF) untuk mengambil status sesi WhatsApp dari service Baileys.
 *
 * `sessionId` diambil dari user yang sedang login (bukan input browser),
 * sehingga user hanya bisa mengakses sesinya sendiri. API Key Baileys hanya
 * dipakai di sisi server lewat `baileysClient` sehingga tidak bocor ke klien.
 */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();

    const session = await whatsappSessionService.getStatus(user.id);

    return ok(session, "Status sesi berhasil diambil");
  });
}
