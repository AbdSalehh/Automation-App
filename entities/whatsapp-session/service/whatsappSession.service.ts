import type { ApiResponse } from "@/shared/api/http";
import { baileysClient } from "@/shared/api/baileysClient";
import type {
  WhatsappSessionStatus,
  SendMessageResult,
  WhatsappSessionSummary,
  ConversationSummary,
  ConversationsMetadata,
  ChatMessage,
  MessagesMetadata,
} from "../model/whatsappSession.model";

/**
 * Envelope list Baileys (bentuk metadata `offset`/`hasMore`, berbeda dari
 * `PaginatedApiResponse` milik AutoFlow sendiri yang memakai `page`/`totalPages`).
 */
interface BaileysListResponse<T, M> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  metadata: M;
}

/**
 * Service untuk WhatsApp API Service (Baileys). Memakai `baileysClient` yang
 * membawa API Key, sehingga modul ini hanya boleh dipanggil dari sisi server
 * (API route / engine), bukan dari komponen klien.
 */
export const whatsappSessionService = {
  /**
   * Mengambil status sesi WhatsApp milik sessionId tertentu beserta QR code
   * (data URL) bila sedang menunggu proses scan.
   */
  getStatus: async (sessionId: string): Promise<WhatsappSessionStatus> => {
    const { data: response } = await baileysClient.get<
      ApiResponse<WhatsappSessionStatus>
    >(`/sessions/${sessionId}/status`);

    return response.data;
  },

  confirmDuplicate: async (sessionId: string): Promise<void> => {
    await baileysClient.post(`/sessions/${sessionId}/duplicate/confirm`);
  },

  cancelDuplicate: async (sessionId: string): Promise<void> => {
    await baileysClient.post(`/sessions/${sessionId}/duplicate/cancel`);
  },

  /**
   * Mengirim pesan teks dari sesi tertentu ke nomor target melalui Baileys.
   */
  sendMessage: async (
    sessionId: string,
    target: string,
    message: string,
  ): Promise<SendMessageResult> => {
    const { data: response } = await baileysClient.post<
      ApiResponse<SendMessageResult>
    >(`/sessions/${sessionId}/send-message`, {
      target,
      message,
    });

    return response.data;
  },

  /**
   * Logout sekaligus menghapus sesi WhatsApp milik sessionId tertentu.
   */
  logout: async (sessionId: string): Promise<void> => {
    await baileysClient.delete(`/sessions/${sessionId}`);
  },

  /**
   * Mengambil daftar seluruh sesi WhatsApp yang terdaftar di service Baileys.
   */
  listSessions: async (): Promise<WhatsappSessionSummary[]> => {
    const { data: response } =
      await baileysClient.get<ApiResponse<WhatsappSessionSummary[]>>(
        "/sessions",
      );

    return response.data;
  },

  /**
   * Mengambil daftar percakapan (ringkasan chat) milik satu sesi, dengan
   * pagination `limit`/`offset`.
   */
  listConversations: async (
    sessionId: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<{
    data: ConversationSummary[];
    metadata: ConversationsMetadata;
  }> => {
    const { data: response } = await baileysClient.get<
      BaileysListResponse<ConversationSummary, ConversationsMetadata>
    >(`/sessions/${sessionId}/conversations`, { params });

    return {
      data: response.data,
      metadata: response.metadata,
    };
  },

  /**
   * Mengambil riwayat pesan untuk satu percakapan dengan pagination.
   */
  listMessages: async (
    sessionId: string,
    jid: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<{ data: ChatMessage[]; metadata: MessagesMetadata }> => {
    const encodedJid = encodeURIComponent(jid);

    const { data: response } = await baileysClient.get<
      BaileysListResponse<ChatMessage, MessagesMetadata>
    >(`/sessions/${sessionId}/conversations/${encodedJid}/messages`, {
      params,
    });

    return {
      data: response.data,
      metadata: response.metadata,
    };
  },

  /**
   * Membuang cache percakapan (`jid`) tertentu dari RAM backend Baileys.
   */
  clearConversationCache: async (
    sessionId: string,
    jid: string,
  ): Promise<void> => {
    const encodedJid = encodeURIComponent(jid);

    await baileysClient.delete(
      `/sessions/${sessionId}/conversations/${encodedJid}/cache`,
    );
  },
};
