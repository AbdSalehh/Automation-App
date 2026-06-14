import { create } from "zustand";
import type * as Ably from "ably";
import { apiClient } from "@/shared/api/apiClient";
import { acquireAblyClient, releaseAblyClient } from "@/shared/lib/ablyClient";
import type { ApiResponse } from "@/shared/api/http";
import type {
  WhatsappSessionStatus,
  SessionUpdatePayload,
} from "../model/whatsappSession.model";

interface WhatsappSessionState {
  status: WhatsappSessionStatus["status"];
  qrDataUrl: string | null;
  isReady: boolean;
  isPolling: boolean;
  isSubscribed: boolean;
  channel: Ably.RealtimeChannel | null;
  pollSessionStatus: () => Promise<void>;
  checkIsSessionActive: () => Promise<boolean>;
  subscribeSession: (sessionId: string) => void;
  unsubscribeSession: () => void;
}

export const useWhatsappSessionStore = create<WhatsappSessionState>(
  (set, get) => ({
    status: "connecting",
    qrDataUrl: null,
    isReady: false,
    isPolling: false,
    isSubscribed: false,
    channel: null,

    /**
     * Mengambil status sesi terbaru dari API route proxy Next.js (bukan Express
     * langsung), sehingga API Key tetap aman di sisi server. Dipakai untuk
     * fetch awal sekali; update berikutnya datang realtime lewat Ably.
     */
    pollSessionStatus: async () => {
      set({ isPolling: true });

      try {
        const { data: response } = await apiClient.get<
          ApiResponse<WhatsappSessionStatus>
        >("/whatsapp/session-status");

        const session = response.data;

        set({
          status: session.status,
          qrDataUrl: session.qr,
          isReady: session.isReady,
        });
      } finally {
        set({ isPolling: false });
      }
    },

    /**
     * Memeriksa sekali apakah sesi WhatsApp sedang tersambung (`open`). Dipakai
     * sebelum menjalankan workflow yang memuat node WhatsApp agar bisa memberi
     * tahu pengguna untuk login ulang bila sesi sudah habis.
     */
    checkIsSessionActive: async () => {
      try {
        const { data: response } = await apiClient.get<
          ApiResponse<WhatsappSessionStatus>
        >("/whatsapp/session-status");

        const session = response.data;

        set({
          status: session.status,
          qrDataUrl: session.qr,
          isReady: session.isReady,
        });

        return session.status === "open" && session.isReady;
      } catch {
        return false;
      }
    },

    /**
     * Men-subscribe event `session-update` milik sesi lewat koneksi Ably
     * bersama agar perubahan QR/status diterima realtime tanpa polling.
     */
    subscribeSession: (sessionId) => {
      if (get().isSubscribed) {
        return;
      }

      const ablyClient = acquireAblyClient();

      const channel = ablyClient.channels.get(`session:${sessionId}`);

      channel.subscribe("session-update", (ablyMessage) => {
        const update = ablyMessage.data as SessionUpdatePayload;

        set({
          status: update.status,
          qrDataUrl: update.qr,
          isReady: update.isReady,
        });
      });

      set({ channel, isSubscribed: true });
    },

    /**
     * Berhenti berlangganan dan melepas satu referensi koneksi bersama saat
     * komponen dilepas.
     */
    unsubscribeSession: () => {
      const { channel } = get();

      if (channel) {
        channel.unsubscribe();
        releaseAblyClient();
      }

      set({ channel: null, isSubscribed: false });
    },
  }),
);
