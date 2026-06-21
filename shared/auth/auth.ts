import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/lib/prisma";
import { getRedisClient } from "@/shared/lib/redis";

/**
 * Auth.js v5 configuration.
 *
 * Dua metode masuk:
 *  1. Google OAuth — akun dibuat otomatis dengan status `pending`, lalu wajib
 *     disetujui admin sebelum bisa masuk.
 *  2. Credentials — email + password untuk akun yang dibuat admin (langsung
 *     `approved`). Salah password beruntun mengunci akun (`isLocked`).
 *
 * Server-only module.
 */

const MAX_FAILED_ATTEMPTS = 5;
const FAILED_WINDOW_SECONDS = 15 * 60;
const isProduction = process.env.NODE_ENV === "production";

/**
 * Menaikkan penghitung gagal login (per email) di Redis. Fail-open: bila Redis
 * mati, kembalikan 0 agar tidak mengunci akun secara keliru.
 */
async function recordFailedLogin(email: string): Promise<number> {
  try {
    const redisClient = await getRedisClient();

    if (!redisClient.isOpen) {
      return 0;
    }

    const key = `login:failed:${email}`;
    const count = await redisClient.incr(key);

    if (count === 1) {
      await redisClient.expire(key, FAILED_WINDOW_SECONDS);
    }

    return count;
  } catch {
    return 0;
  }
}

/**
 * Mereset penghitung gagal login setelah berhasil masuk.
 */
async function resetFailedLogin(email: string): Promise<void> {
  try {
    const redisClient = await getRedisClient();

    if (redisClient.isOpen) {
      await redisClient.del(`login:failed:${email}`);
    }
  } catch {
    /** Abaikan kegagalan reset; tidak memengaruhi korektnya autentikasi. */
  }
}

/**
 * Adapter Prisma dengan override `createUser` agar setiap akun Google baru
 * dibuat dengan status `pending` (menunggu persetujuan admin).
 */
const baseAdapter = PrismaAdapter(prisma as any);

const adapter: Adapter = {
  ...baseAdapter,
  createUser: (data) =>
    baseAdapter.createUser!({ ...data, approvalStatus: "pending" } as any),
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "database" },
  useSecureCookies: isProduction,
  cookies: {
    sessionToken: {
      name: isProduction
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            isActive: true,
            isLocked: true,
            passwordHash: true,
            onboardingCompleted: true,
          },
        });

        if (!user || !user.isActive || !user.passwordHash) {
          return null;
        }

        /** Akun terkunci akibat brute force; hanya admin yang bisa membuka. */
        if (user.isLocked) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          password,
          user.passwordHash,
        );

        if (!passwordMatches) {
          const failedCount = await recordFailedLogin(email);

          if (failedCount >= MAX_FAILED_ATTEMPTS) {
            await prisma.user.update({
              where: { id: user.id },
              data: { isLocked: true },
            });
          }

          return null;
        }

        await resetFailedLogin(email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /**
     * Login Google hanya diizinkan bila akun sudah disetujui admin. Untuk
     * pengguna baru, akun dibuat lebih dulu dengan status `pending` agar
     * permintaan muncul di halaman admin, kemudian login ditolak sampai
     * disetujui. Login credential tidak digerbang di sini (akun credential
     * dibuat admin = langsung approved).
     */
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email;

      if (!email) {
        return "/login?error=PendingApproval";
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { approvalStatus: true, isActive: true },
      });

      /**
       * Pengguna Google baru: buat record `pending` secara manual. Bila tidak,
       * penolakan di callback ini akan membatalkan pembuatan user oleh adapter
       * sehingga permintaan tidak pernah muncul di admin.
       */
      if (!existingUser) {
        await prisma.user.create({
          data: {
            email,
            name: user.name,
            image: user.image,
            approvalStatus: "pending",
          },
        });

        return "/login?error=PendingApproval";
      }

      if (existingUser.approvalStatus !== "approved") {
        return "/login?error=PendingApproval";
      }

      /** Akun yang dinonaktifkan admin tidak boleh masuk. */
      if (!existingUser.isActive) {
        return "/login?error=AccountDeactivated";
      }

      return true;
    },

    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        const fullUser = user as {
          role?: string;
          onboardingCompleted?: boolean;
          isActive?: boolean;
        };

        (session.user as { role?: string }).role = fullUser.role ?? "user";
        (
          session.user as { onboardingCompleted?: boolean }
        ).onboardingCompleted = fullUser.onboardingCompleted ?? false;
        (session.user as { isActive?: boolean }).isActive =
          fullUser.isActive ?? true;
      }

      return session;
    },
  },
});
