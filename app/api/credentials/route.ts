import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import {
  handleRoute,
  ok,
  created,
  badRequest,
  okPaginated,
  parsePagination,
} from "@/shared/api/http";
import { encryptJson } from "@/shared/lib/crypto";
import { CREDENTIAL_TYPES } from "@/shared/config/constants";
import { cacheQuery, cacheKeys, invalidateKeys } from "@/shared/lib/cache";

// GET /api/credentials — list current user's credentials (no secrets, cached).
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams, { limit: 20 });

    const allCredentials = await cacheQuery(
      cacheKeys.credentialList(user.id),
      async () => {
        const credentialRecords = await prisma.credential.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        });

        return credentialRecords.map((credential) => ({
          id: credential.id,
          type: credential.type,
          name: credential.name,
          createdAt: credential.createdAt.toISOString(),
        }));
      },
    );

    const totalItems = allCredentials.length;
    const start = (pagination.page - 1) * pagination.limit;
    const pageItems = allCredentials.slice(start, start + pagination.limit);

    return okPaginated(
      pageItems,
      totalItems,
      pagination,
      "Data kredensial berhasil diambil",
    );
  });
}

// POST /api/credentials — store an encrypted credential.
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    const body = (await request.json()) as {
      type?: string;
      name?: string;
      data?: Record<string, string>;
    };

    if (!body.name?.trim()) {
      return badRequest("Nama kredensial wajib diisi");
    }

    if (!body.type || !CREDENTIAL_TYPES.includes(body.type as never)) {
      return badRequest("Tipe kredensial tidak valid");
    }

    if (!body.data || typeof body.data !== "object") {
      return badRequest("Data kredensial wajib diisi");
    }

    const credential = await prisma.credential.create({
      data: {
        userId: user.id,
        type: body.type,
        name: body.name.trim(),
        data: encryptJson(body.data),
      },
    });

    await invalidateKeys(cacheKeys.credentialList(user.id));

    return created(
      {
        id: credential.id,
        type: credential.type,
        name: credential.name,
        createdAt: credential.createdAt.toISOString(),
      },
      "Kredensial berhasil disimpan",
    );
  });
}
