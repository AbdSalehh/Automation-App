import { create } from "zustand";
import type * as Ably from "ably";
import { v4 as uuidv4 } from "uuid";

import { acquireAblyClient, releaseAblyClient } from "@/shared/lib/ablyClient";
import type { InboundReply } from "../model/whatsappReply.model";

interface WhatsappReplyState {
  replies: InboundReply[];
  isSubscribed: boolean;
  channel: Ably.RealtimeChannel | null;
  subscribeReplies: (sessionId: string) => void;
  unsubscribeReplies: () => void;
}

export const useWhatsappReplyStore = create<WhatsappReplyState>((set, get) => ({
  replies: [],
  isSubscribed: false,
  channel: null,

  /**
   * Men-subscribe channel milik sesi lewat koneksi Ably bersama. Tiap balasan
   * masuk ditambahkan ke daftar `replies`.
   */
  subscribeReplies: (sessionId) => {
    if (get().isSubscribed) {
      return;
    }

    const ablyClient = acquireAblyClient();

    const channel = ablyClient.channels.get(`session:${sessionId}`);

    channel.subscribe("inbound-message", (ablyMessage) => {
      const reply = ablyMessage.data as Omit<InboundReply, "id">;

      set((state) => ({
        replies: [...state.replies, { id: uuidv4(), ...reply }],
      }));
    });

    set({ channel, isSubscribed: true });
  },

  /**
   * Berhenti berlangganan dan melepas satu referensi koneksi bersama saat
   * komponen tidak lagi membutuhkan balasan realtime (mis. saat unmount).
   */
  unsubscribeReplies: () => {
    const { channel } = get();

    if (channel) {
      channel.unsubscribe();
      releaseAblyClient();
    }

    set({ channel: null, isSubscribed: false });
  },
}));
