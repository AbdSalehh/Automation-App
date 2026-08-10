import type { ApiResponse } from "@/shared/api/http";
import { baileysClient, createOwnerHeaders } from "@/shared/api/baileysClient";
import type {
  WhatsappSessionStatus,
  ResolvedWhatsappSession,
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
  resolveSession: async (ownerId: string): Promise<ResolvedWhatsappSession> => {
    const listPath = "/sessions";
    const { data: listResponse } = await baileysClient.get<
      ApiResponse<WhatsappSessionSummary[]>
    >(listPath, {
      headers: createOwnerHeaders(ownerId, "GET", listPath),
    });
    const existingSession = listResponse.data[0];

    if (!existingSession) {
      const createPath = "/sessions";
      const { data: createResponse } = await baileysClient.post<
        ApiResponse<ResolvedWhatsappSession>
      >(createPath, undefined, {
        headers: createOwnerHeaders(ownerId, "POST", createPath),
      });

      return createResponse.data;
    }

    const statusPath = `/sessions/${existingSession.sessionId}/status`;
    const { data: statusResponse } = await baileysClient.get<
      ApiResponse<WhatsappSessionStatus>
    >(statusPath, {
      headers: createOwnerHeaders(ownerId, "GET", statusPath),
    });

    return {
      sessionId: existingSession.sessionId,
      session: statusResponse.data,
    };
  },

  createSession: async (ownerId: string): Promise<ResolvedWhatsappSession> => {
    const path = "/sessions";

    const { data: response } = await baileysClient.post<
      ApiResponse<ResolvedWhatsappSession>
    >(path, undefined, { headers: createOwnerHeaders(ownerId, "POST", path) });

    return response.data;
  },

  getStatus: async (
    ownerId: string,
    sessionId: string,
  ): Promise<WhatsappSessionStatus> => {
    const path = `/sessions/${sessionId}/status`;

    const { data: response } = await baileysClient.get<
      ApiResponse<WhatsappSessionStatus>
    >(path, { headers: createOwnerHeaders(ownerId, "GET", path) });

    return response.data;
  },

  confirmDuplicate: async (
    ownerId: string,
    sessionId: string,
  ): Promise<void> => {
    const path = `/sessions/${sessionId}/duplicate/confirm`;

    await baileysClient.post(path, undefined, {
      headers: createOwnerHeaders(ownerId, "POST", path),
    });
  },

  cancelDuplicate: async (
    ownerId: string,
    sessionId: string,
  ): Promise<void> => {
    const path = `/sessions/${sessionId}/duplicate/cancel`;

    await baileysClient.post(path, undefined, {
      headers: createOwnerHeaders(ownerId, "POST", path),
    });
  },

  sendMessage: async (
    ownerId: string,
    sessionId: string,
    target: string,
    message: string,
  ): Promise<SendMessageResult> => {
    const path = `/sessions/${sessionId}/send-message`;

    const { data: response } = await baileysClient.post<
      ApiResponse<SendMessageResult>
    >(
      path,
      { target, message },
      { headers: createOwnerHeaders(ownerId, "POST", path) },
    );

    return response.data;
  },

  logout: async (ownerId: string, sessionId: string): Promise<void> => {
    const path = `/sessions/${sessionId}`;

    await baileysClient.delete(path, {
      headers: createOwnerHeaders(ownerId, "DELETE", path),
    });
  },

  listSessions: async (ownerId: string): Promise<WhatsappSessionSummary[]> => {
    const path = "/sessions";

    const { data: response } = await baileysClient.get<
      ApiResponse<WhatsappSessionSummary[]>
    >(path, { headers: createOwnerHeaders(ownerId, "GET", path) });

    return response.data;
  },

  listAllSessions: async (): Promise<WhatsappSessionSummary[]> => {
    const { data: response } = await baileysClient.get<
      ApiResponse<WhatsappSessionSummary[]>
    >("/admin/sessions");

    return response.data;
  },

  listConversations: async (
    ownerId: string,
    sessionId: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<{
    data: ConversationSummary[];
    metadata: ConversationsMetadata;
  }> => {
    const path = `/sessions/${sessionId}/conversations`;

    const { data: response } = await baileysClient.get<
      BaileysListResponse<ConversationSummary, ConversationsMetadata>
    >(path, {
      params,
      headers: createOwnerHeaders(ownerId, "GET", path),
    });

    return { data: response.data, metadata: response.metadata };
  },

  listMessages: async (
    ownerId: string,
    sessionId: string,
    jid: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<{ data: ChatMessage[]; metadata: MessagesMetadata }> => {
    const encodedJid = encodeURIComponent(jid);
    const path = `/sessions/${sessionId}/conversations/${encodedJid}/messages`;

    const { data: response } = await baileysClient.get<
      BaileysListResponse<ChatMessage, MessagesMetadata>
    >(path, {
      params,
      headers: createOwnerHeaders(ownerId, "GET", path),
    });

    return { data: response.data, metadata: response.metadata };
  },

  clearConversationCache: async (
    ownerId: string,
    sessionId: string,
    jid: string,
  ): Promise<void> => {
    const encodedJid = encodeURIComponent(jid);
    const path = `/sessions/${sessionId}/conversations/${encodedJid}/cache`;

    await baileysClient.delete(path, {
      headers: createOwnerHeaders(ownerId, "DELETE", path),
    });
  },
};
