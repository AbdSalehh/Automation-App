import { create } from "zustand";
import type * as Ably from "ably";

import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";
import { acquireAblyClient, releaseAblyClient } from "@/shared/lib/ablyClient";
import type {
  ChatMessage,
  ChatUpdatePayload,
  ConversationSummary,
  ConversationsMetadata,
  MessagesMetadata,
  SessionUpdatePayload,
  WhatsappSessionSummary,
} from "../model/whatsappSession.model";

const CONVERSATIONS_PAGE_SIZE = 15;
const MESSAGES_PAGE_SIZE = 50;

interface ChatHistoryState {
  sessions: WhatsappSessionSummary[];
  activeSessionId: string | null;
  activePhoneNumber: string | null;
  isLoadingSessions: boolean;
  conversations: ConversationSummary[];
  conversationsMetadata: ConversationsMetadata | null;
  isLoadingConversations: boolean;
  activeJid: string | null;
  messages: ChatMessage[];
  messagesMetadata: MessagesMetadata | null;
  isLoadingMessages: boolean;
  errorMessage: string | null;
  realtimeClient: Ably.Realtime | null;
  realtimeChannel: Ably.RealtimeChannel | null;
  reconnectHandler: (() => void) | null;
  fetchSessions: () => Promise<void>;
  selectSession: (session: WhatsappSessionSummary) => Promise<void>;
  fetchConversations: (options?: { reset?: boolean }) => Promise<void>;
  openConversation: (jid: string) => Promise<void>;
  fetchMoreMessages: () => Promise<void>;
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
  reset: () => void;
}

export const useChatHistoryStore = create<ChatHistoryState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  activePhoneNumber: null,
  isLoadingSessions: false,
  conversations: [],
  conversationsMetadata: null,
  isLoadingConversations: false,
  activeJid: null,
  messages: [],
  messagesMetadata: null,
  isLoadingMessages: false,
  errorMessage: null,
  realtimeClient: null,
  realtimeChannel: null,
  reconnectHandler: null,

  fetchSessions: async () => {
    set({ isLoadingSessions: true, errorMessage: null });

    try {
      const { data: response } = await apiClient.get<
        ApiResponse<WhatsappSessionSummary[]>
      >("/whatsapp/admin/sessions");

      const readySessions = response.data.filter(
        (whatsappSession) => whatsappSession.isReady,
      );
      const { activeSessionId, activePhoneNumber } = get();
      const activeSession = readySessions.find(
        (whatsappSession) => whatsappSession.sessionId === activeSessionId,
      );

      if (
        activeSessionId &&
        (!activeSession || activeSession.phoneNumber !== activePhoneNumber)
      ) {
        get().unsubscribeRealtime();
        set(createEmptySelectionState());
      }

      set({ sessions: readySessions });
    } catch (error) {
      set({
        errorMessage: getErrorMessage(error) ?? "Gagal memuat sesi WhatsApp",
      });
    } finally {
      set({ isLoadingSessions: false });
    }
  },

  selectSession: async (session) => {
    const sessionIdentity = `${session.sessionId}:${session.phoneNumber ?? ""}`;
    const currentIdentity = `${get().activeSessionId}:${get().activePhoneNumber ?? ""}`;

    if (sessionIdentity === currentIdentity) {
      return;
    }

    get().unsubscribeRealtime();

    set({
      ...createEmptyChatState(),
      activeSessionId: session.sessionId,
      activePhoneNumber: session.phoneNumber,
    });

    await get().fetchConversations({ reset: true });

    if (get().activeSessionId === session.sessionId) {
      get().subscribeRealtime();
    }
  },

  fetchConversations: async (options = {}) => {
    const { reset = true } = options;
    const { activeSessionId, conversations, conversationsMetadata } = get();

    if (!activeSessionId) {
      return;
    }

    const offset = reset
      ? 0
      : conversations.length ||
        (conversationsMetadata?.offset ?? 0) +
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

      if (get().activeSessionId !== activeSessionId) {
        return;
      }

      const { conversations: newConversations, metadata } = response.data;

      set({
        conversations: reset
          ? newConversations
          : deduplicateConversations([...conversations, ...newConversations]),
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
          limit: MESSAGES_PAGE_SIZE,
          offset: 0,
        },
      });

      if (
        get().activeSessionId !== activeSessionId ||
        get().activeJid !== jid
      ) {
        return;
      }

      set({
        messages: deduplicateMessages([...response.data.messages].reverse()),
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
      messagesMetadata.nextOffset === null ||
      isLoadingMessages
    ) {
      return;
    }

    set({ isLoadingMessages: true, errorMessage: null });

    try {
      const { data: response } = await apiClient.get<
        ApiResponse<{ messages: ChatMessage[]; metadata: MessagesMetadata }>
      >(`/whatsapp/conversations/${encodeURIComponent(activeJid)}/messages`, {
        params: {
          sessionId: activeSessionId,
          limit: MESSAGES_PAGE_SIZE,
          offset: messagesMetadata.nextOffset,
        },
      });

      if (
        get().activeSessionId !== activeSessionId ||
        get().activeJid !== activeJid
      ) {
        return;
      }

      const olderMessages = [...response.data.messages].reverse();

      set({
        messages: deduplicateMessages([...olderMessages, ...messages]),
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

  subscribeRealtime: () => {
    const { activeSessionId, realtimeChannel: existingRealtimeChannel } = get();

    if (!activeSessionId || existingRealtimeChannel) {
      return;
    }

    const realtimeClient = acquireAblyClient();
    const realtimeChannel = realtimeClient.channels.get(
      `session:${activeSessionId}`,
    );
    const reconnectHandler = () => {
      get().fetchSessions();
      get().fetchConversations({ reset: true });
    };

    realtimeChannel.subscribe("chat-update", (ablyMessage: Ably.Message) => {
      const message = ablyMessage.data as ChatUpdatePayload;
      const state = get();

      if (!message?.id || !message.jid) {
        return;
      }

      set({
        conversations: upsertConversation(state.conversations, message),
        messages:
          state.activeJid === message.jid
            ? deduplicateMessages([...state.messages, message])
            : state.messages,
      });
    });
    realtimeChannel.subscribe("session-update", (ablyMessage: Ably.Message) => {
      const sessionUpdate = ablyMessage.data as SessionUpdatePayload;
      const state = get();

      if (sessionUpdate.status === "deleted") {
        get().unsubscribeRealtime();
        set({
          sessions: state.sessions.filter(
            (whatsappSession) =>
              whatsappSession.sessionId !== state.activeSessionId,
          ),
          ...createEmptySelectionState(),
          errorMessage:
            "Sesi WhatsApp telah dipindahkan atau dihapus dari layanan.",
        });

        return;
      }

      const updatedPhoneNumber = sessionUpdate.user?.phoneNumber ?? null;

      if (
        sessionUpdate.status === "open" &&
        sessionUpdate.isReady &&
        updatedPhoneNumber &&
        updatedPhoneNumber !== state.activePhoneNumber
      ) {
        set({
          ...createEmptyChatState(),
          activePhoneNumber: updatedPhoneNumber,
          sessions: state.sessions.map((whatsappSession) =>
            whatsappSession.sessionId === state.activeSessionId
              ? {
                  ...whatsappSession,
                  phoneNumber: updatedPhoneNumber,
                  status: sessionUpdate.status,
                  isReady: sessionUpdate.isReady,
                }
              : whatsappSession,
          ),
        });
        get().fetchConversations({ reset: true });
      }
    });
    realtimeClient.connection.on("connected", reconnectHandler);

    set({ realtimeClient, realtimeChannel, reconnectHandler });
  },

  unsubscribeRealtime: () => {
    const { realtimeClient, realtimeChannel, reconnectHandler } = get();

    if (realtimeChannel) {
      realtimeChannel.unsubscribe("chat-update");
      realtimeChannel.unsubscribe("session-update");
    }

    if (realtimeClient && reconnectHandler) {
      realtimeClient.connection.off("connected", reconnectHandler);
    }

    if (realtimeClient) {
      releaseAblyClient();
    }

    set({
      realtimeClient: null,
      realtimeChannel: null,
      reconnectHandler: null,
    });
  },

  reset: () => {
    get().unsubscribeRealtime();

    set({
      sessions: [],
      isLoadingSessions: false,
      ...createEmptySelectionState(),
    });
  },
}));

function createEmptyChatState() {
  return {
    conversations: [],
    conversationsMetadata: null,
    isLoadingConversations: false,
    activeJid: null,
    messages: [],
    messagesMetadata: null,
    isLoadingMessages: false,
    errorMessage: null,
  };
}

function createEmptySelectionState() {
  return {
    activeSessionId: null,
    activePhoneNumber: null,
    ...createEmptyChatState(),
  };
}

function deduplicateMessages(messages: ChatMessage[]): ChatMessage[] {
  return Array.from(
    new Map(messages.map((message) => [message.id, message])).values(),
  ).sort(
    (firstMessage, secondMessage) =>
      new Date(firstMessage.sentAt).getTime() -
      new Date(secondMessage.sentAt).getTime(),
  );
}

function deduplicateConversations(
  conversations: ConversationSummary[],
): ConversationSummary[] {
  return Array.from(
    new Map(
      conversations.map((conversation) => [conversation.jid, conversation]),
    ).values(),
  );
}

function upsertConversation(
  conversations: ConversationSummary[],
  message: ChatMessage,
): ConversationSummary[] {
  const lastMessage: ConversationSummary["lastMessage"] = {
    id: message.id,
    sender: message.sender,
    phoneNumber: message.phoneNumber,
    message: message.message,
    name: message.name,
    messageType: message.messageType,
    media: message.media,
    replyTo: message.replyTo,
    mentions: message.mentions,
    call: message.call,
    fromMe: message.fromMe,
    sentAt: message.sentAt,
  };
  const currentConversation = conversations.find(
    (conversation) => conversation.jid === message.jid,
  );
  const updatedConversation: ConversationSummary = {
    jid: message.jid,
    name:
      currentConversation?.name ||
      message.name ||
      message.sender ||
      message.jid,
    lastMessage,
  };

  return [
    updatedConversation,
    ...conversations.filter((conversation) => conversation.jid !== message.jid),
  ].sort(
    (firstConversation, secondConversation) =>
      getConversationTimestamp(secondConversation) -
      getConversationTimestamp(firstConversation),
  );
}

function getConversationTimestamp(conversation: ConversationSummary): number {
  return conversation.lastMessage
    ? new Date(conversation.lastMessage.sentAt).getTime()
    : 0;
}

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
