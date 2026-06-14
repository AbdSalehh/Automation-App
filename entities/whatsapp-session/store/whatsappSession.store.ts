import { create } from "zustand";
import * as Ably from "ably";
import { apiClient } from "@/shared/api/apiClient";
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
  ablyClient: Ably.Realtime | null;
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
    ablyClient: null,

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
     * Membuka koneksi Ably dan men-subscribe event `session-update` milik sesi
     * agar perubahan QR/status diterima realtime tanpa polling. Token diambil
     * dari endpoint BFF agar API key tetap aman di server.
     */
    subscribeSession: (sessionId) => {
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

      channel.subscribe("session-update", (ablyMessage) => {
        const update = ablyMessage.data as SessionUpdatePayload;

        set({
          status: update.status,
          qrDataUrl: update.qr,
          isReady: update.isReady,
        });
      });

      set({ ablyClient, isSubscribed: true });
    },

    /**
     * Menutup koneksi Ably dan mereset flag langganan saat komponen dilepas.
     */
    unsubscribeSession: () => {
      const { ablyClient } = get();

      if (ablyClient) {
        ablyClient.close();
      }

      set({ ablyClient: null, isSubscribed: false });
    },
  }),
);
