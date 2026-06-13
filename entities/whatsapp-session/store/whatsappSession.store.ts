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
}));
