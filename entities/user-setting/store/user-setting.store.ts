import { create } from "zustand";
import { userSettingService } from "../service/user-setting.service";
import {
  DEFAULT_USER_SETTING,
  type UserSetting,
} from "../model/user-setting.model";

interface UserSettingState {
  setting: UserSetting;
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  successMessage: string | null;

  fetchSetting: () => Promise<void>;
  updateField: <Key extends keyof UserSetting>(
    key: Key,
    value: UserSetting[Key],
  ) => void;
  resetToDefault: () => void;
  saveSetting: () => Promise<boolean>;
}

/**
 * Store setelan editor per-pengguna. Menyimpan preferensi kanvas dan
 * menanganinya lewat service (lihat aturan #6). Perubahan field bersifat lokal
 * sampai pengguna menekan Simpan.
 */
export const useUserSettingStore = create<UserSettingState>((set, get) => ({
  setting: DEFAULT_USER_SETTING,
  isLoading: false,
  isSaving: false,
  errorMessage: null,
  successMessage: null,

  fetchSetting: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const setting = await userSettingService.get();
      set({ setting });
    } catch {
      set({ errorMessage: "Gagal memuat setelan." });
    } finally {
      set({ isLoading: false });
    }
  },

  updateField: (key, value) =>
    set((state) => ({
      setting: { ...state.setting, [key]: value },
      successMessage: null,
    })),

  resetToDefault: () => set({ setting: DEFAULT_USER_SETTING }),

  saveSetting: async () => {
    set({ isSaving: true, errorMessage: null, successMessage: null });

    try {
      const saved = await userSettingService.update(get().setting);

      set({ setting: saved, successMessage: "Setelan tersimpan." });

      return true;
    } catch {
      set({ errorMessage: "Gagal menyimpan setelan." });

      return false;
    } finally {
      set({ isSaving: false });
    }
  },
}));
