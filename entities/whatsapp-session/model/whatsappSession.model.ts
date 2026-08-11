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
  ownerId?: string;
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
  | "location"
  | "contact"
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

export interface SharedLocation {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  url: string;
}

export interface SharedContact {
  displayName: string;
  phoneNumber: string;
}

export interface SharedContacts {
  contacts: SharedContact[];
  contactCount: number;
}

export interface LegacySharedContact extends SharedContact {
  contactCount: number;
}

export type ChatMessagePayload =
  | InboundMedia
  | SharedLocation
  | SharedContacts
  | LegacySharedContact;

export interface WhatsappStory {
  id: string;
  whatsappId: string;
  senderJid: string;
  senderName: string;
  messageType: InboundMessageType;
  message: string;
  media: ChatMessagePayload | null;
  fromMe: boolean;
  sentAt: string;
  expiresAt: string;
  viewedAt: string | null;
}

export interface WhatsappStoryGroup {
  senderJid: string;
  senderName: string;
  stories: WhatsappStory[];
  hasUnviewed: boolean;
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
  media: ChatMessagePayload | null;
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

export const groupWhatsappStories = (
  stories: WhatsappStory[],
): WhatsappStoryGroup[] => {
  const groups = new Map<string, WhatsappStory[]>();

  stories.forEach((story) => {
    groups.set(story.senderJid, [...(groups.get(story.senderJid) ?? []), story]);
  });

  return Array.from(groups, ([senderJid, groupedStories]) => ({
    senderJid,
    senderName: groupedStories[0]?.senderName || senderJid.split("@")[0],
    stories: groupedStories,
    hasUnviewed: groupedStories.some((story) => !story.viewedAt),
  }));
};
