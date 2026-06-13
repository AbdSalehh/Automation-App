/**
 * Status sesi WhatsApp yang dilaporkan oleh service Baileys.
 *
 * - `connecting` : socket sedang menyambung
 * - `qr`         : menunggu QR dipindai (lihat field `qr`)
 * - `open`       : tersambung & siap mengirim
 * - `close`      : terputus
 */
export interface WhatsappSessionStatus {
  status: "connecting" | "qr" | "open" | "close";
  isReady: boolean;
  qr: string | null;
}

/** Hasil pengiriman satu pesan teks lewat Baileys. */
export interface SendMessageResult {
  messageId: string | null;
}
