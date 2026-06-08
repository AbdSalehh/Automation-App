import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/lib/prisma";

/**
 * Auth.js v5 configuration.
 *
 * Supports two sign-in methods:
 *  1. Google OAuth — social login, account created automatically by PrismaAdapter.
 *  2. Credentials — email + password for accounts provisioned by an admin.
 *
 * After first-ever sign-in, users are redirected to /onboarding to complete
 * the setup form. Once onboardingCompleted = true they go straight to /workflows.
 *
 * Server-only module.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as any),
  session: { strategy: "database" },
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
            passwordHash: true,
            onboardingCompleted: true,
          },
        });

        if (!user || !user.isActive || !user.passwordHash) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          password,
          user.passwordHash,
        );

        if (!passwordMatches) {
          return null;
        }

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
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        const fullUser = user as {
          role?: string;
          onboardingCompleted?: boolean;
        };

        (session.user as { role?: string }).role = fullUser.role ?? "user";
        (
          session.user as { onboardingCompleted?: boolean }
        ).onboardingCompleted = fullUser.onboardingCompleted ?? false;
      }

      return session;
    },
  },
});
