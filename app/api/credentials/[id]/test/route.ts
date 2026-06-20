import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok, notFound, badRequest } from "@/shared/api/http";
import { decryptJson } from "@/shared/lib/crypto";
import { CONNECTORS } from "@/shared/server/connectors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/credentials/:id/test — uji koneksi kredensial yang sudah tersimpan.
 *
 * Tidak seperti `/connectors/test` (yang menguji input form mentah), endpoint
 * ini mendekripsi kredensial milik pengguna lalu menjalankan tes konektor.
 */
export async function POST(_request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const existingCredential = await prisma.credential.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingCredential) {
      return notFound("Kredensial tidak ditemukan");
    }

    const connector = CONNECTORS[existingCredential.type];

    if (!connector) {
      return badRequest(
        `Tes koneksi belum didukung untuk tipe "${existingCredential.type}"`,
      );
    }

    const decryptedData = decryptJson<Record<string, string>>(
      existingCredential.data,
    );

    const result = await connector.test(decryptedData);

    return ok({ connected: result.ok }, result.message);
  });
}
