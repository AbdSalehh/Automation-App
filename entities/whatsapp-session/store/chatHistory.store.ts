import { create } from "zustand";
import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";
import type {
  ChatMessage,
  ConversationSummary,
  ConversationsMetadata,
  MessagesMetadata,
  WhatsappSessionSummary,
} from "../model/whatsappSession.model";

const CONVERSATIONS_PAGE_SIZE = 15;
const MESSAGES_PAGE_SIZE = 100;

interface ChatHistoryState {
  sessions: WhatsappSessionSummary[];
  activeSessionId: string | null;
  isLoadingSessions: boolean;
  conversations: ConversationSummary[];
  conversationsMetadata: ConversationsMetadata | null;
  isLoadingConversations: boolean;
  activeJid: string | null;
  messages: ChatMessage[];
  messagesMetadata: MessagesMetadata | null;
  isLoadingMessages: boolean;
  errorMessage: string | null;
  fetchSessions: () => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  fetchConversations: (options?: { reset?: boolean }) => Promise<void>;
  openConversation: (jid: string) => Promise<void>;
  fetchMoreMessages: () => Promise<void>;
  clearActiveConversationCache: () => Promise<void>;
  reset: () => void;
}

export const useChatHistoryStore = create<ChatHistoryState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  isLoadingSessions: false,
  conversations: [],
  conversationsMetadata: null,
  isLoadingConversations: false,
  activeJid: null,
  messages: [],
  messagesMetadata: null,
  isLoadingMessages: false,
  errorMessage: null,

  fetchSessions: async () => {
    set({ isLoadingSessions: true, errorMessage: null });

    try {
      const { data: response } = await apiClient.get<
        ApiResponse<WhatsappSessionSummary[]>
      >("/whatsapp/admin/sessions");

      set({ sessions: response.data });
    } catch (error) {
      set({
        errorMessage: getErrorMessage(error) ?? "Gagal memuat sesi WhatsApp",
      });
    } finally {
      set({ isLoadingSessions: false });
    }
  },

  selectSession: async (sessionId) => {
    set({
      activeSessionId: sessionId,
      conversations: [],
      conversationsMetadata: null,
      activeJid: null,
      messages: [],
      messagesMetadata: null,
      errorMessage: null,
    });

    await get().fetchConversations({ reset: true });
  },

  fetchConversations: async (options = {}) => {
    const { reset = true } = options;
    const { activeSessionId, conversations, conversationsMetadata } = get();

    if (!activeSessionId) {
      return;
    }

    const offset = reset
      ? 0
      : (conversationsMetadata?.offset ?? 0) +
        (conversationsMetadata?.limit ?? CONVERSATIONS_PAGE_SIZE);

    set({ isLoadingConversations: true, errorMessage: null });

    try {
      const { data: response } = await apiClient.get<
        ApiResponse<{
          conversations: ConversationSummary[];
          metadata: ConversationsMetadata;
        }>
      >("/whatsapp/conversations", {
        params: {
          sessionId: activeSessionId,
          limit: CONVERSATIONS_PAGE_SIZE,
          offset,
        },
      });

      const { conversations: newConversations, metadata } = response.data;

      set({
        conversations: reset
          ? newConversations
          : [...conversations, ...newConversations],
        conversationsMetadata: metadata,
      });
    } catch (error) {
      set({
        errorMessage:
          getErrorMessage(error) ?? "Gagal memuat daftar percakapan",
      });
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  openConversation: async (jid) => {
    const { activeSessionId } = get();

    if (!activeSessionId) {
      return;
    }

    set({
      activeJid: jid,
      messages: [],
      messagesMetadata: null,
      errorMessage: null,
      isLoadingMessages: true,
    });

    try {
      const { data: response } = await apiClient.get<
        ApiResponse<{ messages: ChatMessage[]; metadata: MessagesMetadata }>
      >(`/whatsapp/conversations/${encodeURIComponent(jid)}/messages`, {
        params: {
          sessionId: activeSessionId,
          hours: 24,
          limit: MESSAGES_PAGE_SIZE,
          offset: 0,
        },
      });

      set({
        messages: response.data.messages,
        messagesMetadata: response.data.metadata,
      });
    } catch (error) {
      set({
        errorMessage: getErrorMessage(error) ?? "Gagal memuat riwayat pesan",
      });
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  fetchMoreMessages: async () => {
    const {
      activeSessionId,
      activeJid,
      messages,
      messagesMetadata,
      isLoadingMessages,
    } = get();

    if (
      !activeSessionId ||
      !activeJid ||
      !messagesMetadata?.hasMore ||
      isLoadingMessages
    ) {
      return;
    }

    const nextOffset = messagesMetadata.offset + messagesMetadata.limit;

    set({ isLoadingMessages: true, errorMessage: null });

    try {
      const { data: response } = await apiClient.get<
        ApiResponse<{ messages: ChatMessage[]; metadata: MessagesMetadata }>
      >(`/whatsapp/conversations/${encodeURIComponent(activeJid)}/messages`, {
        params: {
          sessionId: activeSessionId,
          hours: 24,
          limit: MESSAGES_PAGE_SIZE,
          offset: nextOffset,
        },
      });

      set({
        messages: [...messages, ...response.data.messages],
        messagesMetadata: response.data.metadata,
      });
    } catch (error) {
      set({
        errorMessage: getErrorMessage(error) ?? "Gagal memuat pesan sebelumnya",
      });
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  clearActiveConversationCache: async () => {
    const { activeSessionId, activeJid } = get();

    if (!activeSessionId || !activeJid) {
      return;
    }

    try {
      await apiClient.delete(
        `/whatsapp/conversations/${encodeURIComponent(activeJid)}/cache`,
        { params: { sessionId: activeSessionId } },
      );
    } catch (error) {
      set({
        errorMessage:
          getErrorMessage(error) ?? "Gagal menghapus cache percakapan",
      });
    }
  },

  reset: () => {
    set({
      sessions: [],
      activeSessionId: null,
      isLoadingSessions: false,
      conversations: [],
      conversationsMetadata: null,
      isLoadingConversations: false,
      activeJid: null,
      messages: [],
      messagesMetadata: null,
      isLoadingMessages: false,
      errorMessage: null,
    });
  },
}));

function getErrorMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
  ) {
    const responseData = (error.response as { data?: { message?: string } })
      .data;

    return responseData?.message ?? null;
  }

  return null;
}
