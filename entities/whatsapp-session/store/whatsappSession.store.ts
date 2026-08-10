import { create } from "zustand";
import type * as Ably from "ably";
import { apiClient } from "@/shared/api/apiClient";
import {
  acquireAblyClient,
  refreshAblyAuthorization,
  releaseAblyClient,
} from "@/shared/lib/ablyClient";
import type { ApiResponse } from "@/shared/api/http";
import type {
  PendingDuplicateSession,
  ResolvedWhatsappSession,
  WhatsappSessionStatus,
  SessionUpdatePayload,
  WhatsappSessionSummary,
} from "../model/whatsappSession.model";

interface WhatsappSessionState {
  status: WhatsappSessionStatus["status"];
  sessionId: string | null;
  qrDataUrl: string | null;
  isReady: boolean;
  pendingDuplicate: PendingDuplicateSession | null;
  isPolling: boolean;
  isResolvingDuplicate: boolean;
  duplicateErrorMessage: string | null;
  isCreatingSession: boolean;
  createSessionErrorMessage: string | null;
  sessions: WhatsappSessionSummary[];
  isLoadingSessions: boolean;
  isSubscribed: boolean;
  channel: Ably.RealtimeChannel | null;
  pollSessionStatus: () => Promise<void>;
  loadSessions: () => Promise<void>;
  createSession: () => Promise<boolean>;
  checkIsSessionActive: () => Promise<boolean>;
  confirmDuplicate: () => Promise<void>;
  cancelDuplicate: () => Promise<void>;
  subscribeSession: (sessionId: string) => void;
  unsubscribeSession: () => void;
}

export const useWhatsappSessionStore = create<WhatsappSessionState>(
  (set, get) => ({
    status: "connecting",
    sessionId: null,
    qrDataUrl: null,
    isReady: false,
    pendingDuplicate: null,
    isPolling: false,
    isResolvingDuplicate: false,
    duplicateErrorMessage: null,
    isCreatingSession: false,
    createSessionErrorMessage: null,
    sessions: [],
    isLoadingSessions: false,
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
          ApiResponse<ResolvedWhatsappSession>
        >("/whatsapp/session-status");

        const { sessionId, session } = response.data;

        set({
          sessionId,
          status: session.status,
          qrDataUrl: session.qr,
          isReady: session.isReady,
          pendingDuplicate: session.pendingDuplicate ?? null,
          duplicateErrorMessage: null,
        });
      } finally {
        set({ isPolling: false });
      }
    },

    loadSessions: async () => {
      set({ isLoadingSessions: true });

      try {
        const { data: response } = await apiClient.get<
          ApiResponse<WhatsappSessionSummary[]>
        >("/whatsapp/sessions/list");

        set({ sessions: response.data });
      } finally {
        set({ isLoadingSessions: false });
      }
    },

    createSession: async () => {
      set({ isCreatingSession: true, createSessionErrorMessage: null });

      try {
        const { data: response } =
          await apiClient.post<ApiResponse<ResolvedWhatsappSession>>(
            "/whatsapp/sessions",
          );
        const { sessionId, session } = response.data;

        get().unsubscribeSession();
        await refreshAblyAuthorization();

        set({
          sessionId,
          status: session.status,
          qrDataUrl: session.qr,
          isReady: session.isReady,
          pendingDuplicate: session.pendingDuplicate ?? null,
        });

        return true;
      } catch {
        set({
          createSessionErrorMessage: "Gagal menambahkan akun WhatsApp",
        });

        return false;
      } finally {
        set({ isCreatingSession: false });
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
          ApiResponse<ResolvedWhatsappSession>
        >("/whatsapp/session-status");

        const { sessionId, session } = response.data;

        set({
          sessionId,
          status: session.status,
          qrDataUrl: session.qr,
          isReady: session.isReady,
          pendingDuplicate: session.pendingDuplicate ?? null,
        });

        return session.status === "open" && session.isReady;
      } catch {
        return false;
      }
    },

    confirmDuplicate: async () => {
      const { sessionId } = get();

      if (!sessionId) {
        set({ duplicateErrorMessage: "Sesi WhatsApp belum tersedia" });
        return;
      }

      set({ isResolvingDuplicate: true, duplicateErrorMessage: null });

      try {
        await apiClient.post("/whatsapp/session-duplicate/confirm", {
          sessionId,
        });
        await get().pollSessionStatus();
      } catch {
        set({ duplicateErrorMessage: "Gagal mengonfirmasi pemindahan nomor" });
      } finally {
        set({ isResolvingDuplicate: false });
      }
    },

    cancelDuplicate: async () => {
      const { sessionId } = get();

      if (!sessionId) {
        set({ duplicateErrorMessage: "Sesi WhatsApp belum tersedia" });
        return;
      }

      set({ isResolvingDuplicate: true, duplicateErrorMessage: null });

      try {
        await apiClient.post("/whatsapp/session-duplicate/cancel", {
          sessionId,
        });
        await get().pollSessionStatus();
      } catch {
        set({ duplicateErrorMessage: "Gagal membatalkan pemindahan nomor" });
      } finally {
        set({ isResolvingDuplicate: false });
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
          pendingDuplicate: update.pendingDuplicate ?? null,
          duplicateErrorMessage: null,
        });

        if (update.isReady) {
          void get().loadSessions();
        }
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
