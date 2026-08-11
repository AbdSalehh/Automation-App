import { badRequest, forbidden, handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

interface RouteParams {
  params: Promise<{ storyId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();

    if (user.role !== "admin") {
      return forbidden();
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId")?.trim();
    const ownerId = searchParams.get("ownerId")?.trim();
    const { storyId } = await params;

    if (!sessionId || !ownerId || !storyId) {
      return badRequest("Session ID, owner ID, dan story ID wajib diisi");
    }

    await whatsappSessionService.markStoryViewed(ownerId, sessionId, storyId);

    return ok({ viewed: true }, "Story ditandai dilihat pada aplikasi");
  });
}
