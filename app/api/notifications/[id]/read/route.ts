import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok, notFound } from "@/shared/api/http";

/**
 * PATCH /api/notifications/[id]/read — menandai satu notifikasi milik pengguna
 * sebagai sudah dibaca. Memakai updateMany berfilter userId agar tidak bisa
 * menandai notifikasi milik orang lain.
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const user = await requireUser();

    const { id } = await params;

    const result = await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });

    if (result.count === 0) {
      return notFound("Notifikasi tidak ditemukan");
    }

    return ok(null, "Notifikasi ditandai sudah dibaca");
  });
}
