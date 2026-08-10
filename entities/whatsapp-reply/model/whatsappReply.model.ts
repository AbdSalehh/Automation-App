/** Jenis pesan masuk dari WhatsApp. */
export type InboundMessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "sticker"
  | "location"
  | "contact";

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

export type InboundPayload =
  | InboundMedia
  | SharedLocation
  | SharedContacts
  | LegacySharedContact;

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
  media: InboundPayload | null;
  sentAt: string | null;
  receivedAt: string;
}
