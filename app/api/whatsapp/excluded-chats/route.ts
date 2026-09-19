import { badRequest, forbidden, handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

/**
 * Mengambil daftar percakapan yang sedang disembunyikan.
 */
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    if (user.role !== "admin") {
      return forbidden();
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId")?.trim();
    const ownerId = searchParams.get("ownerId")?.trim();

    if (!sessionId || !ownerId) {
      return badRequest("Session ID dan owner ID wajib diisi");
    }

    const excludedChats = await whatsappSessionService.listExcludedChats(
      ownerId,
      sessionId,
    );

    return ok({ excludedChats }, "Daftar chat tersembunyi berhasil diambil");
  });
}

/**
 * Menyembunyikan sebuah percakapan agar tidak tampil dan tidak lagi mengunggah
 * media ke Cloudinary.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    if (user.role !== "admin") {
      return forbidden();
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId")?.trim();
    const ownerId = searchParams.get("ownerId")?.trim();

    if (!sessionId || !ownerId) {
      return badRequest("Session ID dan owner ID wajib diisi");
    }

    const body = (await request.json().catch(() => null)) as {
      jid?: string;
    } | null;
    const jid = body?.jid?.trim();

    if (!jid) {
      return badRequest("JID wajib diisi");
    }

    await whatsappSessionService.hideConversation(ownerId, sessionId, jid);

    return ok({ jid }, "Chat berhasil disembunyikan");
  });
}

/**
 * Mengembalikan percakapan yang disembunyikan agar tampil kembali.
 */
export async function DELETE(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    if (user.role !== "admin") {
      return forbidden();
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId")?.trim();
    const ownerId = searchParams.get("ownerId")?.trim();
    const jid = searchParams.get("jid")?.trim();

    if (!sessionId || !ownerId || !jid) {
      return badRequest("Session ID, owner ID, dan JID wajib diisi");
    }

    await whatsappSessionService.unhideConversation(ownerId, sessionId, jid);

    return ok({ jid }, "Chat berhasil ditampilkan kembali");
  });
}
