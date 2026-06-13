import type { ApiResponse } from "@/shared/api/http";
import { baileysClient } from "@/shared/api/baileysClient";
import type {
  WhatsappSessionStatus,
  SendMessageResult,
} from "../model/whatsappSession.model";

/**
 * Service untuk WhatsApp API Service (Baileys). Memakai `baileysClient` yang
 * membawa API Key, sehingga modul ini hanya boleh dipanggil dari sisi server
 * (API route / engine), bukan dari komponen klien.
 */
export const whatsappSessionService = {
  /**
   * Mengambil status sesi WhatsApp milik sessionId tertentu beserta QR code
   * (data URL) bila sedang menunggu proses scan.
   */
  getStatus: async (sessionId: string): Promise<WhatsappSessionStatus> => {
    const { data: response } = await baileysClient.get<
      ApiResponse<WhatsappSessionStatus>
    >(`/sessions/${sessionId}/status`);

    return response.data;
  },

  /**
   * Mengirim pesan teks dari sesi tertentu ke nomor target melalui Baileys.
   */
  sendMessage: async (
    sessionId: string,
    target: string,
    message: string,
  ): Promise<SendMessageResult> => {
    const { data: response } = await baileysClient.post<
      ApiResponse<SendMessageResult>
    >(`/sessions/${sessionId}/send-message`, {
      target,
      message,
    });

    return response.data;
  },

  /**
   * Logout sekaligus menghapus sesi WhatsApp milik sessionId tertentu.
   */
  logout: async (sessionId: string): Promise<void> => {
    await baileysClient.delete(`/sessions/${sessionId}`);
  },
};
