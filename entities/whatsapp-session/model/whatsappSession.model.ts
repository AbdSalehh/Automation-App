/**
 * Status sesi WhatsApp yang dilaporkan oleh service Baileys.
 *
 * - `connecting` : socket sedang menyambung
 * - `qr`         : menunggu QR dipindai (lihat field `qr`)
 * - `open`       : tersambung & siap mengirim
 * - `close`      : terputus
 */
export interface PendingDuplicateSession {
  phoneNumber: string;
  conflictingSessionIds: string[];
}

export interface WhatsappSessionUser {
  phoneNumber?: string | null;
  name?: string | null;
}

export interface WhatsappSessionStatus {
  status: "connecting" | "qr" | "open" | "close" | "deleted";
  isReady: boolean;
  qr: string | null;
  pendingDuplicate: PendingDuplicateSession | null;
  user: WhatsappSessionUser | null;
}

/**
 * Payload event `session-update` yang dipush realtime lewat Ably saat status
 * sesi, QR, atau profil berubah.
 */
export interface SessionUpdatePayload {
  status: WhatsappSessionStatus["status"];
  isReady: boolean;
  qr: string | null;
  pendingDuplicate: PendingDuplicateSession | null;
  user: WhatsappSessionUser | null;
}

/** Hasil pengiriman satu pesan teks lewat Baileys. */
export interface SendMessageResult {
  messageId: string | null;
}

/** Ringkasan satu sesi WhatsApp dari `GET /sessions`. */
export interface WhatsappSessionSummary {
  sessionId: string;
  status: WhatsappSessionStatus["status"];
  isReady: boolean;
  phoneNumber: string | null;
  name: string | null;
  connectedAt: string | null;
}

export interface ResolvedWhatsappSession {
  sessionId: string;
  session: WhatsappSessionStatus;
}

export type InboundMessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "sticker"
  | "call";

export interface MessageReply {
  id: string;
  senderJid: string;
  message: string;
  messageType: InboundMessageType;
}

export type WhatsappCallStatus =
  | "offer"
  | "ringing"
  | "accept"
  | "terminate"
  | "reject"
  | "timeout";

export interface WhatsappCall {
  status: WhatsappCallStatus;
  isVideo: boolean;
  isGroup: boolean;
  durationSeconds: number | null;
}

/** Metadata media masuk (sudah diunggah ke Cloudinary, hanya URL & info). */
export interface InboundMedia {
  mimetype: string;
  fileName: string;
  fileLength: number;
  url: string;
}

export interface ChatMention {
  jid: string;
  number: string;
  name: string;
}

/** Satu pesan chat (dipakai untuk `lastMessage` maupun riwayat pesan). */
export interface ChatMessage {
  id: string;
  jid: string;
  sender: string;
  phoneNumber?: string;
  message: string;
  name: string;
  messageType: InboundMessageType;
  media: InboundMedia | null;
  replyTo: MessageReply | null;
  mentions: ChatMention[] | null;
  call: WhatsappCall | null;
  fromMe: boolean;
  sentAt: string;
  receivedAt?: string;
}

/** Ringkasan satu percakapan (daftar chat per sesi). */
export interface ConversationSummary {
  jid: string;
  name: string;
  lastMessage: Omit<ChatMessage, "jid" | "receivedAt"> | null;
}

/** Metadata pagination untuk daftar percakapan. */
export interface ConversationsMetadata {
  limit: number;
  offset: number;
  totalItems: number;
  hasMore: boolean;
}

/** Metadata pagination untuk riwayat pesan. */
export interface MessagesMetadata extends ConversationsMetadata {
  nextOffset: number | null;
}

/** Payload event realtime `chat-update`. */
export type ChatUpdatePayload = ChatMessage;
