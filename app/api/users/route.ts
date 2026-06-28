import { NextRequest } from "next/server";
import { requireUser } from "@/shared/auth";
import { prisma } from "@/shared/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "../../../prisma/lib/generated/prisma";
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

    const searchParams = new URL(request.url).searchParams;

    const { page, limit } = parsePagination(searchParams, { limit: 10 });

    const search = (searchParams.get("search") ?? "").trim();
    const roleFilter = searchParams.get("role") ?? "all";
    const statusFilter = searchParams.get("status") ?? "all";

    const whereClause: Prisma.UserWhereInput = {};

    if (search.length > 0) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (roleFilter === "user" || roleFilter === "admin") {
      whereClause.role = roleFilter;
    }

    /**
     * Memetakan filter status UI ke kondisi Prisma yang sesuai. "active" berarti
     * sudah disetujui dan aktif; "inactive" berarti dinonaktifkan, dst.
     */
    switch (statusFilter) {
      case "active":
        whereClause.approvalStatus = "approved";
        whereClause.isActive = true;
        break;
      case "inactive":
        whereClause.isActive = false;
        break;
      case "pending":
        whereClause.approvalStatus = "pending";
        break;
      case "rejected":
        whereClause.approvalStatus = "rejected";
        break;
      case "locked":
        whereClause.isLocked = true;
        break;
      default:
        break;
    }

    const [users, totalItems] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
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
      prisma.user.count({ where: whereClause }),
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
      return unprocessable("Invalid data");
    }

    const { name, email, password, role } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return unprocessable("Email is already registered");
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
