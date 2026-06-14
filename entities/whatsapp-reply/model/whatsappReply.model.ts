/** Balasan WhatsApp masuk yang dipush realtime lewat Ably. */
export interface InboundReply {
  id: string;
  sessionId: string;
  sender: string;
  message: string;
  name: string;
  sentAt: string | null;
  receivedAt: string;
}
