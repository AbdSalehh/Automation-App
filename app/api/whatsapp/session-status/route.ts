import { handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";
import {
  sessionIdForChannel,
  type WhatsappChannel,
} from "@/shared/server/whatsapp/sessions";

/**
 * Proxy aman (BFF) untuk mengambil status sesi WhatsApp dari service Baileys.
 *
 * `sessionId` diturunkan dari user yang sedang login (bukan input browser),
 * sehingga user hanya bisa mengakses sesinya sendiri. Parameter `channel`
 * memilih akun agen (default) atau akun workflow. API Key Baileys hanya dipakai
 * di sisi server lewat `baileysClient` sehingga tidak bocor ke klien.
 */
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    const { searchParams } = new URL(request.url);

    const channel: WhatsappChannel =
      searchParams.get("channel") === "workflow" ? "workflow" : "agent";

    const sessionId = sessionIdForChannel(user.id, channel);

    const session = await whatsappSessionService.getStatus(sessionId);

    return ok(session, "Status sesi berhasil diambil");
  });
}
