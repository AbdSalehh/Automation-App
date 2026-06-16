/** Jenis pesan masuk dari WhatsApp. */
export type InboundMessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "sticker";

/** Metadata media yang sudah diunggah backend ke Cloudinary. */
export interface InboundMedia {
  mimetype: string;
  fileName: string;
  fileLength: number;
  url: string;
}

/** Balasan WhatsApp masuk yang dipush realtime lewat Ably. */
export interface InboundReply {
  id: string;
  sessionId: string;
  sender: string;
  message: string;
  name: string;
  messageType: InboundMessageType;
  media: InboundMedia | null;
  sentAt: string | null;
  receivedAt: string;
}
