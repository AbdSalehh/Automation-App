import { badRequest, forbidden, handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

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

    const stories = await whatsappSessionService.listStories(ownerId, sessionId);

    return ok(stories, "Daftar story berhasil diambil");
  });
}
