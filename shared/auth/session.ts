import { auth } from "./auth";
import { prisma } from "@/shared/lib/prisma";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
  onboardingCompleted: boolean;
  isActive: boolean;
}

/**
 * Jeda minimum antar-pembaruan `lastSeenAt` per pengguna. Mencegah tulisan DB
 * pada tiap request; cukup tandai aktivitas sekali per interval ini.
 */
const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;

/** Penanda kapan terakhir `lastSeenAt` ditulis per pengguna (in-memory). */
const lastSeenWriteAt = new Map<string, number>();

/**
 * Memperbarui `lastSeenAt` pengguna secara throttled & fire-and-forget. Gagal-aman:
 * kesalahan diabaikan agar tidak mengganggu alur autentikasi.
 */
function touchLastSeen(userId: string): void {
  const now = Date.now();
  const previousWrite = lastSeenWriteAt.get(userId) ?? 0;

  if (now - previousWrite < LAST_SEEN_THROTTLE_MS) {
    return;
  }

  lastSeenWriteAt.set(userId, now);

  prisma.user
    .update({
      where: { id: userId },
      data: { lastSeenAt: new Date(now) },
    })
    .catch(() => {
      /** Abaikan; pelacakan aktivitas bukan jalur kritikal. */
    });
}

/**
 * Returns the authenticated user or null. Server-only.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const sessionUser = session.user as {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    onboardingCompleted?: boolean;
    isActive?: boolean;
  };

  /**
   * Akun yang dinonaktifkan admin diperlakukan seperti tidak login agar layout
   * yang memakai helper ini mengalihkan ke halaman login (auto-logout).
   */
  if (sessionUser.isActive === false) {
    return null;
  }

  touchLastSeen(sessionUser.id);

  return {
    id: sessionUser.id,
    name: sessionUser.name,
    email: sessionUser.email,
    image: sessionUser.image,
    role: sessionUser.role ?? "user",
    onboardingCompleted: sessionUser.onboardingCompleted ?? false,
    isActive: sessionUser.isActive ?? true,
  };
}

/**
 * Returns the authenticated user or throws an Error with a 401-style message.
 * Use inside route handlers and wrap with {@link requireUserResponse} mapping.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
