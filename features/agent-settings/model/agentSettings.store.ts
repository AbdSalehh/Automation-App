import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";
import {
  AI_PROVIDER_DEFAULT_MODEL,
  type AiProviderId,
} from "@/shared/config/constants";

/**
 * Satu baris penyedia AI di form. `id` lokal dipakai untuk key React & operasi
 * ubah/hapus; `apiKey` selalu kosong saat dimuat ulang karena server tidak
 * pernah membocorkan secret.
 */
export interface ProviderDraft {
  id: string;
  provider: AiProviderId;
  apiKey: string;
  model: string;
}

/** Metadata penyedia yang dikembalikan server (tanpa API key). */
interface ProviderStatus {
  provider: AiProviderId;
  model: string;
}

interface AgentConfigStatus {
  enabled: boolean;
  providers?: ProviderStatus[];
  hasBotToken?: boolean;
}

interface AgentSettingsState {
  enabled: boolean;
  botToken: string;
  providers: ProviderDraft[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;

  setBotToken: (botToken: string) => void;
  addProvider: () => void;
  removeProvider: (providerId: string) => void;
  updateProvider: (providerId: string, patch: Partial<ProviderDraft>) => void;
  moveProvider: (providerId: string, direction: "up" | "down") => void;
  fetchStatus: () => Promise<void>;
  saveConfig: () => Promise<boolean>;
  disableAgent: () => Promise<void>;
}

/** Membuat satu baris penyedia kosong (default Gemini). */
function createProviderDraft(): ProviderDraft {
  return {
    id: uuidv4(),
    provider: "gemini",
    apiKey: "",
    model: AI_PROVIDER_DEFAULT_MODEL.gemini,
  };
}

export const useAgentSettingsStore = create<AgentSettingsState>((set, get) => ({
  enabled: false,
  botToken: "",
  providers: [createProviderDraft()],
  isLoading: false,
  isSaving: false,
  error: null,
  successMessage: null,

  setBotToken: (botToken) => set({ botToken }),

  addProvider: () =>
    set((state) => ({
      providers: [...state.providers, createProviderDraft()],
    })),

  removeProvider: (providerId) =>
    set((state) => {
      const remaining = state.providers.filter(
        (provider) => provider.id !== providerId,
      );

      return {
        providers: remaining.length > 0 ? remaining : [createProviderDraft()],
      };
    }),

  updateProvider: (providerId, patch) =>
    set((state) => ({
      providers: state.providers.map((provider) =>
        provider.id === providerId ? { ...provider, ...patch } : provider,
      ),
    })),

  moveProvider: (providerId, direction) =>
    set((state) => {
      const index = state.providers.findIndex(
        (provider) => provider.id === providerId,
      );

      if (index === -1) {
        return {};
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= state.providers.length) {
        return {};
      }

      const reordered = [...state.providers];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, moved);

      return { providers: reordered };
    }),

  fetchStatus: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data: response } =
        await apiClient.get<ApiResponse<AgentConfigStatus>>("/agent/config");

      const status = response.data;

      /**
       * API key tidak pernah dikirim balik dari server, jadi field apiKey
       * dibiarkan kosong dan pengguna mengisinya kembali saat menyimpan.
       */
      const loadedProviders =
        status.providers && status.providers.length > 0
          ? status.providers.map((provider) => ({
              id: uuidv4(),
              provider: provider.provider,
              apiKey: "",
              model: provider.model,
            }))
          : [createProviderDraft()];

      set({
        enabled: status.enabled,
        providers: loadedProviders,
      });
    } catch {
      set({ error: "Gagal memuat status agen chat-action." });
    } finally {
      set({ isLoading: false });
    }
  },

  saveConfig: async () => {
    const { botToken, providers } = get();

    if (!botToken.trim()) {
      set({ error: "Bot Token Telegram wajib diisi." });
      return false;
    }

    const filledProviders = providers.filter(
      (provider) => provider.apiKey.trim() && provider.model.trim(),
    );

    if (filledProviders.length === 0) {
      set({
        error: "Minimal satu penyedia AI dengan API key dan model wajib diisi.",
      });
      return false;
    }

    set({ isSaving: true, error: null, successMessage: null });

    try {
      await apiClient.post("/agent/config", {
        botToken: botToken.trim(),
        providers: filledProviders.map((provider) => ({
          provider: provider.provider,
          apiKey: provider.apiKey.trim(),
          model: provider.model.trim(),
        })),
      });

      set({
        enabled: true,
        botToken: "",
        providers: filledProviders.map((provider) => ({
          ...provider,
          apiKey: "",
        })),
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
