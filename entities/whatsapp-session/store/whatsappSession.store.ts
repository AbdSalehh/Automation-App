import { create } from "zustand";
import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";
import type { WhatsappSessionStatus } from "../model/whatsappSession.model";

interface WhatsappSessionState {
  status: WhatsappSessionStatus["status"];
  qrDataUrl: string | null;
  isReady: boolean;
  isPolling: boolean;
  pollSessionStatus: () => Promise<void>;
  checkIsSessionActive: () => Promise<boolean>;
}

export const useWhatsappSessionStore = create<WhatsappSessionState>((set) => ({
  status: "connecting",
  qrDataUrl: null,
  isReady: false,
  isPolling: false,

  /**
   * Mengambil status sesi terbaru dari API route proxy Next.js (bukan Express
   * langsung), sehingga API Key tetap aman di sisi server.
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
}));
