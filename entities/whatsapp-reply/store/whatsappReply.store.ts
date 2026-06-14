import { create } from "zustand";
import * as Ably from "ably";
import { v4 as uuidv4 } from "uuid";

import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";
import type { InboundReply } from "../model/whatsappReply.model";

interface WhatsappReplyState {
  replies: InboundReply[];
  isSubscribed: boolean;
  ablyClient: Ably.Realtime | null;
  subscribeReplies: (sessionId: string) => Promise<void>;
  unsubscribeReplies: () => void;
}

export const useWhatsappReplyStore = create<WhatsappReplyState>((set, get) => ({
  replies: [],
  isSubscribed: false,
  ablyClient: null,

  /**
   * Membuka koneksi Ably dan men-subscribe channel milik sesi tertentu.
   * Token diambil dari endpoint BFF agar API key tetap aman di server.
   */
  subscribeReplies: async (sessionId) => {
    if (get().isSubscribed) {
      return;
    }

    const ablyClient = new Ably.Realtime({
      authCallback: async (_tokenParams, callback) => {
        try {
          const { data: response } = await apiClient.get<
            ApiResponse<Ably.TokenRequest>
          >("/whatsapp/ably-token");

          callback(null, response.data);
        } catch (error) {
          callback(error as string, null);
        }
      },
    });

    const channel = ablyClient.channels.get(`session:${sessionId}`);

    channel.subscribe("inbound-message", (ablyMessage) => {
      const reply = ablyMessage.data as Omit<InboundReply, "id">;

      set((state) => ({
        replies: [...state.replies, { id: uuidv4(), ...reply }],
      }));
    });

    set({ ablyClient, isSubscribed: true });
  },

  /**
   * Menutup koneksi Ably dan mereset state saat komponen tidak lagi
   * membutuhkan balasan realtime (mis. saat unmount).
   */
  unsubscribeReplies: () => {
    const { ablyClient } = get();

    if (ablyClient) {
      ablyClient.close();
    }

    set({ ablyClient: null, isSubscribed: false });
  },
}));
