import { NextRequest } from "next/server";
import { requireUser } from "@/shared/auth";
import { prisma } from "@/shared/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  handleRoute,
  forbidden,
  badRequest,
  notFound,
  unprocessable,
  ok,
  noContent,
} from "@/shared/api/http";
import { createNotification } from "@/shared/server/notifications/createNotification";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  isActive: true,
  isLocked: true,
  approvalStatus: true,
  onboardingCompleted: true,
  createdAt: true,
} as const;

const patchSchema = z.object({
  action: z.enum(["reset-password", "approve", "reject", "unlock"]),
  password: z.string().min(8, "Password minimal 8 karakter").optional(),
});

/**
 * PATCH /api/users/[id] — aksi admin terhadap user: reset password, setujui,
 * tolak, atau buka kunci. Hanya admin.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const sessionUser = await requireUser();

    if (sessionUser.role !== "admin") {
      return forbidden();
    }

    const { id } = await params;

    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      return notFound("Pengguna tidak ditemukan");
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return unprocessable("Data tidak valid");
    }

    const { action, password } = parsed.data;

    if (action === "reset-password") {
      if (!password) {
        return badRequest("Password baru wajib diisi");
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { passwordHash, isLocked: false },
        select: USER_SELECT,
      });

      return ok(updatedUser, "Password berhasil direset");
    }

    if (action === "approve") {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { approvalStatus: "approved" },
        select: USER_SELECT,
      });

      await createNotification({
        userId: id,
        type: "account_approved",
        title: "Akun Anda telah disetujui",
        body: "Selamat datang! Anda kini dapat masuk dan mulai membuat workflow.",
        link: "/dashboard",
      });

      return ok(updatedUser, "Pengguna berhasil disetujui");
    }

    if (action === "reject") {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { approvalStatus: "rejected" },
        select: USER_SELECT,
      });

      return ok(updatedUser, "Pengguna berhasil ditolak");
    }

    /** action === "unlock" */
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isLocked: false },
      select: USER_SELECT,
    });

    return ok(updatedUser, "Kunci pengguna berhasil dibuka");
  });
}

/**
 * DELETE /api/users/[id] — hapus user. Hanya admin, tidak bisa hapus diri sendiri.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const sessionUser = await requireUser();

    if (sessionUser.role !== "admin") {
      return forbidden();
    }

    const { id } = await params;

    if (id === sessionUser.id) {
      return badRequest("Anda tidak dapat menghapus akun sendiri");
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      return notFound("Pengguna tidak ditemukan");
    }

    await prisma.user.delete({ where: { id } });

    return noContent();
  });
}
