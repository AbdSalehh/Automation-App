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
  action: z.enum([
    "reset-password",
    "approve",
    "reject",
    "unlock",
    "deactivate",
    "activate",
  ]),
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
      return notFound("User not found");
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return unprocessable("Invalid data");
    }

    const { action, password } = parsed.data;

    if (action === "reset-password") {
      if (!password) {
        return badRequest("New password is required");
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
        title: "Your account has been approved",
        body: "Welcome! You can now sign in and start building workflows.",
        link: "/dashboard",
      });

      return ok(updatedUser, "User approved successfully");
    }

    if (action === "reject") {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { approvalStatus: "rejected" },
        select: USER_SELECT,
      });

      return ok(updatedUser, "Pengguna berhasil ditolak");
    }

    if (action === "deactivate") {
      if (id === sessionUser.id) {
        return badRequest("You cannot deactivate your own account");
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: USER_SELECT,
      });

      /**
       * Hapus seluruh sesi pengguna agar yang sedang login langsung ter-logout
       * pada navigasi berikutnya (strategi sesi berbasis database).
       */
      await prisma.session.deleteMany({ where: { userId: id } });

      await createNotification({
        userId: id,
        type: "system",
        title: "Your account has been deactivated",
        body: "Contact an administrator if you believe this is a mistake.",
      });

      return ok(updatedUser, "User deactivated successfully");
    }

    if (action === "activate") {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive: true },
        select: USER_SELECT,
      });

      return ok(updatedUser, "Pengguna berhasil diaktifkan");
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
      return badRequest("You cannot delete your own account");
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      return notFound("User not found");
    }

    await prisma.user.delete({ where: { id } });

    return noContent();
  });
}
