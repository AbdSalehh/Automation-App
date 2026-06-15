import Ably from "ably";

/**
 * Publisher Ably sisi server untuk memberi tahu klien (editor) bahwa sebuah
 * eksekusi workflow telah berjalan/selesai, agar animasi run node dapat diputar
 * realtime — termasuk untuk eksekusi yang dipicu webhook (balasan WhatsApp) dan
 * schedule/cron, bukan hanya run manual.
 *
 * Memakai `Ably.Rest` dengan API key penuh; hanya boleh dipakai di sisi server.
 */
export type ExecutionUpdateStatus = "running" | "success" | "failed" | "paused";

interface ExecutionUpdatePayload {
  executionId: string;
  workflowId: string;
  status: ExecutionUpdateStatus;
}

/**
 * Mem-publish event `execution-update` ke channel milik pemilik workflow.
 * Kegagalan publish sengaja ditelan agar tidak menggagalkan eksekusi workflow.
 */
export async function publishExecutionUpdate(
  ownerId: string,
  payload: ExecutionUpdatePayload,
): Promise<void> {
  const apiKey = process.env.ABLY_API_KEY;

  if (!apiKey || !ownerId) {
    return;
  }

  try {
    const ablyRest = new Ably.Rest({ key: apiKey });

    const channel = ablyRest.channels.get(`session:${ownerId}`);

    await channel.publish("execution-update", payload);
  } catch {
    /** Abaikan — animasi realtime bersifat best-effort. */
  }
}
