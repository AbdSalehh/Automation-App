import { create } from "zustand";
import { apiClient } from "@/shared/api/apiClient";
import { credentialService } from "@/entities/credential";

export type UsagePurpose = "learning" | "personal" | "professional" | "team";

interface OnboardingFormData {
  usagePurpose: UsagePurpose | null;
  organisation: string;
  geminiApiKey: string;
}

interface OnboardingState {
  formData: OnboardingFormData;
  isLoading: boolean;
  isSavingGeminiKey: boolean;
  error: string | null;
  setUsagePurpose: (usagePurpose: UsagePurpose) => void;
  setOrganisation: (organisation: string) => void;
  setGeminiApiKey: (geminiApiKey: string) => void;
  saveGeminiKey: () => Promise<boolean>;
  submitOnboarding: () => Promise<boolean>;
  resetError: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  formData: {
    usagePurpose: null,
    organisation: "",
    geminiApiKey: "",
  },
  isLoading: false,
  isSavingGeminiKey: false,
  error: null,

  setUsagePurpose: (usagePurpose) =>
    set((state) => ({
      formData: { ...state.formData, usagePurpose },
    })),

  setOrganisation: (organisation) =>
    set((state) => ({
      formData: { ...state.formData, organisation },
    })),

  setGeminiApiKey: (geminiApiKey) =>
    set((state) => ({
      formData: { ...state.formData, geminiApiKey },
    })),

  saveGeminiKey: async () => {
    const { formData } = get();
    const apiKey = formData.geminiApiKey.trim();

    if (!apiKey) {
      set({ error: "Masukkan Gemini API key terlebih dahulu." });
      return false;
    }

    set({ isSavingGeminiKey: true, error: null });

    try {
      await credentialService.create({
        type: "gemini",
        name: "Gemini AI (Onboarding)",
        data: { apiKey },
      });

      return true;
    } catch {
      set({
        error: "Gagal menyimpan Gemini API key. Periksa kembali key Anda.",
      });
      return false;
    } finally {
      set({ isSavingGeminiKey: false });
    }
  },

  submitOnboarding: async () => {
    const { formData } = get();

    if (!formData.usagePurpose) {
      set({ error: "Pilih tujuan penggunaan terlebih dahulu." });
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      await apiClient.post("/users/onboarding", {
        usagePurpose: formData.usagePurpose,
        organisation: formData.organisation.trim() || undefined,
      });

      return true;
    } catch {
      set({ error: "Terjadi kesalahan. Silakan coba lagi." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  resetError: () => set({ error: null }),
}));
