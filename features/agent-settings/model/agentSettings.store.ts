import { create } from "zustand";
import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";
import { GEMINI_MODEL } from "@/shared/config/constants";

interface AgentConfigStatus {
  enabled: boolean;
  geminiModel?: string;
  hasBotToken?: boolean;
  hasGeminiApiKey?: boolean;
}

interface AgentSettingsState {
  enabled: boolean;
  geminiModel: string;
  botToken: string;
  geminiApiKey: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
  setBotToken: (botToken: string) => void;
  setGeminiApiKey: (geminiApiKey: string) => void;
  setGeminiModel: (geminiModel: string) => void;
  fetchStatus: () => Promise<void>;
  saveConfig: () => Promise<boolean>;
  disableAgent: () => Promise<void>;
}

export const useAgentSettingsStore = create<AgentSettingsState>((set, get) => ({
  enabled: false,
  geminiModel: GEMINI_MODEL,
  botToken: "",
  geminiApiKey: "",
  isLoading: false,
  isSaving: false,
  error: null,
  successMessage: null,

  setBotToken: (botToken) => set({ botToken }),
  setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
  setGeminiModel: (geminiModel) => set({ geminiModel }),

  fetchStatus: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data: response } =
        await apiClient.get<ApiResponse<AgentConfigStatus>>("/agent/config");

      const status = response.data;

      set({
        enabled: status.enabled,
        geminiModel: status.geminiModel || GEMINI_MODEL,
      });
    } catch {
      set({ error: "Gagal memuat status agen chat-action." });
    } finally {
      set({ isLoading: false });
    }
  },

  saveConfig: async () => {
    const { botToken, geminiApiKey, geminiModel } = get();

    if (!botToken.trim() || !geminiApiKey.trim()) {
      set({ error: "Bot Token dan Gemini API key wajib diisi." });
      return false;
    }

    set({ isSaving: true, error: null, successMessage: null });

    try {
      await apiClient.post("/agent/config", {
        botToken: botToken.trim(),
        geminiApiKey: geminiApiKey.trim(),
        geminiModel,
      });

      set({
        enabled: true,
        botToken: "",
        geminiApiKey: "",
        successMessage: "Agen chat-action berhasil diaktifkan.",
      });

      return true;
    } catch {
      set({
        error:
          "Gagal mengaktifkan agen. Periksa kembali Bot Token dan API key Anda.",
      });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  disableAgent: async () => {
    set({ isSaving: true, error: null, successMessage: null });

    try {
      await apiClient.delete("/agent/config");

      set({
        enabled: false,
        successMessage: "Agen chat-action dinonaktifkan.",
      });
    } catch {
      set({ error: "Gagal menonaktifkan agen." });
    } finally {
      set({ isSaving: false });
    }
  },
}));
