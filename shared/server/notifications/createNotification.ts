import { prisma } from "@/shared/lib/prisma";

/**
 * Pembuat notifikasi sisi-server.
 *
 * Dipakai oleh runner, alur akun, dan kredensial untuk mencatat notifikasi
 * per-pengguna. Sengaja "fail-safe": kegagalan menulis notifikasi tidak boleh
 * menggagalkan alur utama, jadi error hanya dicatat ke log.
 *
 * Server-only module.
 */

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
  } catch (error) {
    console.error("[notification] gagal membuat notifikasi", error);
  }
}
