import { create } from "zustand";
import { apiClient } from "@/shared/api/apiClient";

export type UsagePurpose = "learning" | "personal" | "professional" | "team";

interface OnboardingFormData {
  usagePurpose: UsagePurpose | null;
  organisation: string;
}

interface OnboardingState {
  formData: OnboardingFormData;
  isLoading: boolean;
  error: string | null;
  setUsagePurpose: (usagePurpose: UsagePurpose) => void;
  setOrganisation: (organisation: string) => void;
  submitOnboarding: () => Promise<boolean>;
  resetError: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  formData: {
    usagePurpose: null,
    organisation: "",
  },
  isLoading: false,
  error: null,

  setUsagePurpose: (usagePurpose) =>
    set((state) => ({
      formData: { ...state.formData, usagePurpose },
    })),

  setOrganisation: (organisation) =>
    set((state) => ({
      formData: { ...state.formData, organisation },
    })),

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
