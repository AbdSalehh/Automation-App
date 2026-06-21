import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, okPaginated, parsePagination } from "@/shared/api/http";

/**
 * GET /api/notifications — daftar notifikasi pengguna yang sedang login,
 * terbaru di atas. Mendukung paginasi `?page=&limit=`.
 */
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams, { limit: 20 });

    const [records, totalItems] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.notification.count({ where: { userId: user.id } }),
    ]);

    const notifications = records.map((record) => ({
      id: record.id,
      type: record.type,
      title: record.title,
      body: record.body,
      link: record.link,
      isRead: record.isRead,
      createdAt: record.createdAt.toISOString(),
    }));

    return okPaginated(
      notifications,
      totalItems,
      pagination,
      "Daftar notifikasi",
    );
  });
}
