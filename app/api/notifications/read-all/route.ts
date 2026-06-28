import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok } from "@/shared/api/http";

/**
 * PATCH /api/notifications/read-all — menandai seluruh notifikasi pengguna yang
 * sedang login sebagai sudah dibaca.
 */
export async function PATCH() {
  return handleRoute(async () => {
    const user = await requireUser();

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return ok(null, "All notifications marked as read");
  });
}
