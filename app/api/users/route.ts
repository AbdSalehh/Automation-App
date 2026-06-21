import { NextRequest } from "next/server";
import { requireUser } from "@/shared/auth";
import { prisma } from "@/shared/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  handleRoute,
  forbidden,
  created,
  unprocessable,
  okPaginated,
  parsePagination,
} from "@/shared/api/http";

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["user", "admin"]).default("user"),
});

/**
 * GET /api/users — daftar seluruh user. Hanya admin.
 */
export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const sessionUser = await requireUser();

    if (sessionUser.role !== "admin") {
      return forbidden();
    }

    const { page, limit } = parsePagination(new URL(request.url).searchParams, {
      limit: 50,
    });

    const [users, totalItems] = await Promise.all([
      prisma.user.findMany({
        select: {
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
          lastSeenAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    return okPaginated(users, totalItems, { page, limit });
  });
}

/**
 * POST /api/users — buat user baru (email + password). Hanya admin.
 */
export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const sessionUser = await requireUser();

    if (sessionUser.role !== "admin") {
      return forbidden();
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return unprocessable("Data tidak valid");
    }

    const { name, email, password, role } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return unprocessable("Email sudah terdaftar");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        passwordHash,
        isActive: true,
        onboardingCompleted: false,
      },
      select: {
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
        lastSeenAt: true,
      },
    });

    return created(newUser, "Pengguna berhasil dibuat");
  });
}
