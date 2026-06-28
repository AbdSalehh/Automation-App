import { create } from "zustand";
import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";

/** Metadata penyedia yang dikembalikan server (tanpa API key). */
interface ProviderStatus {
  provider: string;
  model: string;
}

interface AgentConfigStatus {
  enabled: boolean;
  providers?: ProviderStatus[];
  credentialIds?: string[];
  hasBotToken?: boolean;
}

interface AgentSettingsState {
  enabled: boolean;
  botToken: string;
  /** Id kredensial AI terurut (indeks 0 = prioritas utama). */
  credentialIds: string[];
  /** Ringkasan penyedia aktif dari server (untuk badge informasi). */
  activeProviders: ProviderStatus[];
  isLoading: boolean;
  isSaving: boolean;
  isReregistering: boolean;
  error: string | null;
  successMessage: string | null;

  setBotToken: (botToken: string) => void;
  setCredentialIds: (credentialIds: string[]) => void;
  fetchStatus: () => Promise<void>;
  saveConfig: () => Promise<boolean>;
  reregisterWebhook: () => Promise<void>;
  disableAgent: () => Promise<void>;
}

export const useAgentSettingsStore = create<AgentSettingsState>((set, get) => ({
  enabled: false,
  botToken: "",
  credentialIds: [],
  activeProviders: [],
  isLoading: false,
  isSaving: false,
  isReregistering: false,
  error: null,
  successMessage: null,

  setBotToken: (botToken) => set({ botToken }),

  setCredentialIds: (credentialIds) => set({ credentialIds }),

  fetchStatus: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data: response } =
        await apiClient.get<ApiResponse<AgentConfigStatus>>("/agent/config");

      const status = response.data;

      set({
        enabled: status.enabled,
        credentialIds: status.credentialIds ?? [],
        activeProviders: status.providers ?? [],
      });
    } catch {
      set({ error: "Failed to load chat-action agent status." });
    } finally {
      set({ isLoading: false });
    }
  },

  saveConfig: async () => {
    const { botToken, credentialIds } = get();

    if (!botToken.trim()) {
      set({ error: "Telegram Bot Token is required." });
      return false;
    }

    if (credentialIds.length === 0) {
      set({ error: "At least one AI credential must be selected." });
      return false;
    }

    set({ isSaving: true, error: null, successMessage: null });

    try {
      await apiClient.post("/agent/config", {
        botToken: botToken.trim(),
        credentialIds,
      });

      set({
        enabled: true,
        botToken: "",
        successMessage: "Chat-action agent enabled successfully.",
      });

      return true;
    } catch {
      set({
        error:
          "Failed to enable the agent. Double-check your Bot Token and AI credentials.",
      });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  /**
   * Mendaftarkan ulang webhook Telegram untuk config yang sudah ada (mis. agar
   * bot lama mulai menerima tombol Ya/Batal) tanpa memasukkan ulang token.
   */
  reregisterWebhook: async () => {
    set({ isReregistering: true, error: null, successMessage: null });

    try {
      await apiClient.patch("/agent/config");

      set({ successMessage: "Webhook re-registered successfully." });
    } catch {
      set({ error: "Failed to re-register the webhook." });
    } finally {
      set({ isReregistering: false });
    }
  },

  disableAgent: async () => {
    set({ isSaving: true, error: null, successMessage: null });

    try {
      await apiClient.delete("/agent/config");

      set({
        enabled: false,
        credentialIds: [],
        activeProviders: [],
        successMessage: "Chat-action agent disabled.",
      });
    } catch {
      set({ error: "Failed to disable the agent." });
    } finally {
      set({ isSaving: false });
    }
  },
}));
