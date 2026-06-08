import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, noContent, notFound } from "@/shared/api/http";
import { invalidateKeys, cacheKeys } from "@/shared/lib/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/credentials/:id
export async function DELETE(_request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const existingCredential = await prisma.credential.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingCredential) {
      return notFound("Kredensial tidak ditemukan");
    }

    await prisma.credential.delete({ where: { id } });

    await invalidateKeys(cacheKeys.credentialList(user.id));

    return noContent();
  });
}
