import bcrypt from "bcryptjs";
import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok, badRequest } from "@/shared/api/http";

/** Panjang minimal password baru. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * PATCH /api/account/password — mengubah password akun berbasis kredensial.
 * Pengguna Google (tanpa `passwordHash`) tidak diizinkan dan mendapat 400.
 * Password lama diverifikasi sebelum hash baru disimpan.
 */
export async function PATCH(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      return badRequest(
        `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter`,
      );
    }

    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!account?.passwordHash) {
      return badRequest(
        "Akun ini masuk lewat Google sehingga tidak memiliki password",
      );
    }

    const currentMatches = await bcrypt.compare(
      currentPassword,
      account.passwordHash,
    );

    if (!currentMatches) {
      return badRequest("The old password is incorrect");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return ok({ updated: true }, "Password berhasil diubah");
  });
}
