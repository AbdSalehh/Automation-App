import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok } from "@/shared/api/http";

/**
 * GET /api/search?q= — pencarian global ringkas milik pengguna yang login.
 * Mengembalikan workflow dan kredensial yang cocok (maksimal beberapa item per
 * kategori) untuk command palette. Pencarian case-insensitive.
 */
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();

    if (!query) {
      return ok({ workflows: [], credentials: [] }, "Kueri kosong");
    }

    const [workflows, credentials] = await Promise.all([
      prisma.workflow.findMany({
        where: {
          ownerId: user.id,
          name: { contains: query, mode: "insensitive" },
        },
        select: { id: true, name: true },
        take: 6,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.credential.findMany({
        where: {
          userId: user.id,
          name: { contains: query, mode: "insensitive" },
        },
        select: { id: true, name: true, type: true },
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return ok({ workflows, credentials }, "Hasil pencarian");
  });
}
