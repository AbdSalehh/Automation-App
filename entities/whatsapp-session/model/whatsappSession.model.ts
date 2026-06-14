/**
 * Status sesi WhatsApp yang dilaporkan oleh service Baileys.
 *
 * - `connecting` : socket sedang menyambung
 * - `qr`         : menunggu QR dipindai (lihat field `qr`)
 * - `open`       : tersambung & siap mengirim
 * - `close`      : terputus
 */
export interface WhatsappSessionStatus {
  status: "connecting" | "qr" | "open" | "close" | "deleted";
  isReady: boolean;
  qr: string | null;
}

/**
 * Payload event `session-update` yang dipush realtime lewat Ably saat status
 * sesi, QR, atau profil berubah.
 */
export interface SessionUpdatePayload {
  status: WhatsappSessionStatus["status"];
  isReady: boolean;
  qr: string | null;
  user: unknown | null;
}

/** Hasil pengiriman satu pesan teks lewat Baileys. */
export interface SendMessageResult {
  messageId: string | null;
}
