import { prisma } from "@/shared/lib/prisma";

/**
 * Penyimpanan state konfirmasi agen chat-action berbasis database.
 *
 * Sebelumnya state ini disimpan di Redis. Karena Redis tidak selalu tersedia di
 * lingkungan serverless, state dipindah ke tabel `AgentPendingAction` agar alur
 * konfirmasi "ya/batal" tetap berjalan andal.
 *
 * Server-only module.
 */

/**
 * Aksi yang menunggu jawaban "ya/batal": membuat baru, mengubah, atau menghapus
 * workflow.
 */
export interface PendingState {
  type: "create" | "edit" | "delete";
  prompt?: string;
  workflowId?: string;
  workflowName?: string;
}

/** TTL state konfirmasi pembuatan (10 menit). */
const PENDING_TTL_MS = 600_000;

/**
 * Mengambil state konfirmasi yang masih berlaku untuk pasangan owner+pengirim.
 * State yang sudah kedaluwarsa dihapus dan dianggap tidak ada.
 */
export async function getPendingAction(
  ownerId: string,
  sender: string,
): Promise<PendingState | null> {
  const record = await prisma.agentPendingAction.findUnique({
    where: { ownerId_sender: { ownerId, sender } },
  });

  if (!record) {
    return null;
  }

  if (Number(record.expiresAt) < Date.now()) {
    await clearPendingAction(ownerId, sender);

    return null;
  }

  try {
    return JSON.parse(record.payload) as PendingState;
  } catch {
    return null;
  }
}

/**
 * Menyimpan (atau menimpa) state konfirmasi untuk pasangan owner+pengirim.
 */
export async function setPendingAction(
  ownerId: string,
  sender: string,
  state: PendingState,
): Promise<void> {
  const payload = JSON.stringify(state);
  const expiresAt = BigInt(Date.now() + PENDING_TTL_MS);

  await prisma.agentPendingAction.upsert({
    where: { ownerId_sender: { ownerId, sender } },
    create: { ownerId, sender, payload, expiresAt },
    update: { payload, expiresAt },
  });
}

/**
 * Menghapus state konfirmasi (mis. setelah dikonfirmasi/dibatalkan).
 * Aman dipanggil meski tidak ada state tersimpan.
 */
export async function clearPendingAction(
  ownerId: string,
  sender: string,
): Promise<void> {
  await prisma.agentPendingAction
    .delete({
      where: { ownerId_sender: { ownerId, sender } },
    })
    .catch(() => undefined);
}
