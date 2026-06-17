import { create } from "zustand";
import { accountService } from "../service/account.service";
import type { UpdateProfilePayload } from "../model/account.model";

/**
 * Store akun pengguna. Sesuai coding rule #6, seluruh state loading/error dan
 * pemanggilan service untuk update profil & password dikelola di sini, bukan di
 * komponen.
 */
interface AccountState {
  isSavingProfile: boolean;
  isChangingPassword: boolean;
  errorMessage: string | null;
  successMessage: string | null;

  updateProfile: (payload: UpdateProfilePayload) => Promise<boolean>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
  resetMessages: () => void;
}

/** Mengubah error tak dikenal menjadi pesan yang ramah dibaca pengguna. */
function toErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return fallback;
}

export const useAccountStore = create<AccountState>((set) => ({
  isSavingProfile: false,
  isChangingPassword: false,
  errorMessage: null,
  successMessage: null,

  updateProfile: async (payload) => {
    set({ isSavingProfile: true, errorMessage: null, successMessage: null });

    try {
      await accountService.updateProfile(payload);

      set({ successMessage: "Profil berhasil diperbarui." });

      return true;
    } catch (error) {
      set({ errorMessage: toErrorMessage(error, "Gagal memperbarui profil.") });

      return false;
    } finally {
      set({ isSavingProfile: false });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isChangingPassword: true, errorMessage: null, successMessage: null });

    try {
      await accountService.changePassword({ currentPassword, newPassword });

      set({ successMessage: "Password berhasil diubah." });

      return true;
    } catch (error) {
      set({ errorMessage: toErrorMessage(error, "Gagal mengubah password.") });

      return false;
    } finally {
      set({ isChangingPassword: false });
    }
  },

  resetMessages: () => set({ errorMessage: null, successMessage: null }),
}));
