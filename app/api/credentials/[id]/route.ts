import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import {
  handleRoute,
  ok,
  noContent,
  notFound,
  badRequest,
} from "@/shared/api/http";
import { encryptJson, decryptJson } from "@/shared/lib/crypto";
import { invalidateKeys, cacheKeys } from "@/shared/lib/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/credentials/:id — perbarui nama dan/atau field rahasia.
 *
 * Field rahasia yang dikirim kosong tidak menimpa nilai lama, sehingga pengguna
 * bisa mengganti nama saja tanpa harus mengisi ulang seluruh token.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const existingCredential = await prisma.credential.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingCredential) {
      return notFound("Kredensial tidak ditemukan");
    }

    const body = (await request.json()) as {
      name?: string;
      data?: Record<string, string>;
    };

    const nextName = body.name?.trim();

    if (body.name !== undefined && !nextName) {
      return badRequest("Nama kredensial tidak boleh kosong");
    }

    /**
     * Gabungkan field lama dengan field baru. Field baru yang kosong diabaikan
     * agar secret yang sudah tersimpan tidak terhapus.
     */
    const currentData = decryptJson<Record<string, string>>(
      existingCredential.data,
    );

    const mergedData: Record<string, string> = { ...currentData };

    if (body.data && typeof body.data === "object") {
      for (const [fieldKey, fieldValue] of Object.entries(body.data)) {
        if (fieldValue?.trim()) {
          mergedData[fieldKey] = fieldValue;
        }
      }
    }

    const updatedCredential = await prisma.credential.update({
      where: { id },
      data: {
        name: nextName ?? existingCredential.name,
        data: encryptJson(mergedData),
      },
    });

    await invalidateKeys(cacheKeys.credentialList(user.id));

    return ok(
      {
        id: updatedCredential.id,
        type: updatedCredential.type,
        name: updatedCredential.name,
        createdAt: updatedCredential.createdAt.toISOString(),
      },
      "Kredensial berhasil diperbarui",
    );
  });
}

/** DELETE /api/credentials/:id — hapus kredensial milik pengguna. */
export async function DELETE(_request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const existingCredential = await prisma.credential.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingCredential) {
      return notFound("Kredensial tidak ditemukan");
    }

    await prisma.credential.delete({ where: { id } });

    await invalidateKeys(cacheKeys.credentialList(user.id));

    return noContent();
  });
}
