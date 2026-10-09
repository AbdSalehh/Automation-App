import { create } from "zustand";

import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";
import type {
  WhatsappCallEntry,
  WhatsappCallsMetadata,
} from "../model/whatsappSession.model";

/**
 * Store riwayat panggilan harian. Dipisah dari store chat agar daftar
 * percakapan tidak ikut me-render ulang setiap kali riwayat panggilan
 * disegarkan.
 */
interface CallHistoryState {
  calls: WhatsappCallEntry[];
  metadata: WhatsappCallsMetadata | null;
  isLoading: boolean;
  errorMessage: string | null;
  fetchCalls: (sessionId: string, ownerId: string) => Promise<void>;
  reset: () => void;
}

export const useCallStore = create<CallHistoryState>((set) => ({
  calls: [],
  metadata: null,
  isLoading: false,
  errorMessage: null,

  fetchCalls: async (sessionId, ownerId) => {
    set({ isLoading: true, errorMessage: null });

    try {
      const { data: response } = await apiClient.get<
        ApiResponse<{
          data: WhatsappCallEntry[];
          metadata: WhatsappCallsMetadata;
        }>
      >("/whatsapp/calls", { params: { sessionId, ownerId } });

      set({ calls: response.data.data, metadata: response.data.metadata });
    } catch {
      set({ errorMessage: "Gagal memuat riwayat panggilan" });
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () =>
    set({
      calls: [],
      metadata: null,
      isLoading: false,
      errorMessage: null,
    }),
}));
