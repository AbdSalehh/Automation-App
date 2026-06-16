import { prisma } from "@/shared/lib/prisma";
import { decryptJson } from "@/shared/lib/crypto";

/**
 * Memuat & mendekripsi kredensial milik `ownerId` berdasarkan id. Mengembalikan
 * objek key/value plaintext, atau null bila tidak ada. Server-only.
 */
export async function loadCredential(
  credentialId: string | undefined,
  ownerId: string,
): Promise<Record<string, string> | null> {
  if (!credentialId) {
    return null;
  }

  const credentialRecord = await prisma.credential.findFirst({
    where: { id: credentialId, userId: ownerId },
  });

  if (!credentialRecord) {
    return null;
  }

  return decryptJson<Record<string, string>>(credentialRecord.data);
}
