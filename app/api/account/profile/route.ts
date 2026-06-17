import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok, badRequest } from "@/shared/api/http";

/** Batas ukuran foto profil (base64) ~2MB agar tidak membebani DB. */
const MAX_IMAGE_LENGTH = 2_800_000;

/**
 * PATCH /api/account/profile — memperbarui nama tampilan dan/atau foto profil
 * pengguna yang sedang login. Foto dikirim sebagai data URL (base64) dan
 * disimpan langsung di kolom `User.image`.
 */
export async function PATCH(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    const body = (await request.json()) as {
      name?: string;
      image?: string | null;
    };

    const updateData: { name?: string; image?: string | null } = {};

    if (typeof body.name === "string") {
      const trimmedName = body.name.trim();

      if (!trimmedName) {
        return badRequest("Nama tidak boleh kosong");
      }

      updateData.name = trimmedName;
    }

    if (body.image !== undefined) {
      if (
        typeof body.image === "string" &&
        body.image.length > MAX_IMAGE_LENGTH
      ) {
        return badRequest("Ukuran foto terlalu besar (maksimal sekitar 2MB)");
      }

      updateData.image = body.image;
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest("Tidak ada perubahan yang dikirim");
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: { id: true, name: true, image: true },
    });

    return ok(updatedUser, "Profil berhasil diperbarui");
  });
}
