import { create } from "zustand";
import { managedUserService } from "../service/managed-user.service";
import type { ManagedUser } from "../model/managed-user.model";

interface ManagedUserState {
  users: ManagedUser[];
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  fetchUsers: () => Promise<void>;
  resetPassword: (userId: string, password: string) => Promise<boolean>;
  approveUser: (userId: string) => Promise<boolean>;
  rejectUser: (userId: string) => Promise<boolean>;
  unlockUser: (userId: string) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
}

export const useManagedUserStore = create<ManagedUserState>((set, get) => ({
  users: [],
  isLoading: false,
  isSubmitting: false,
  errorMessage: null,

  fetchUsers: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const users = await managedUserService.list();
      set({ users });
    } catch {
      set({ errorMessage: "Gagal memuat daftar pengguna." });
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (userId, password) => {
    set({ isSubmitting: true, errorMessage: null });

    try {
      await managedUserService.resetPassword(userId, password);
      return true;
    } catch {
      set({ errorMessage: "Gagal mereset password pengguna." });
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  approveUser: async (userId) => {
    set({ isSubmitting: true, errorMessage: null });

    try {
      const updatedUser = await managedUserService.approve(userId);

      set({
        users: get().users.map((user) =>
          user.id === userId ? updatedUser : user,
        ),
      });

      return true;
    } catch {
      set({ errorMessage: "Gagal menyetujui pengguna." });
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  rejectUser: async (userId) => {
    set({ isSubmitting: true, errorMessage: null });

    try {
      const updatedUser = await managedUserService.reject(userId);

      set({
        users: get().users.map((user) =>
          user.id === userId ? updatedUser : user,
        ),
      });

      return true;
    } catch {
      set({ errorMessage: "Gagal menolak pengguna." });
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  unlockUser: async (userId) => {
    set({ isSubmitting: true, errorMessage: null });

    try {
      const updatedUser = await managedUserService.unlock(userId);

      set({
        users: get().users.map((user) =>
          user.id === userId ? updatedUser : user,
        ),
      });

      return true;
    } catch {
      set({ errorMessage: "Gagal membuka kunci pengguna." });
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  removeUser: async (userId) => {
    set({ isSubmitting: true, errorMessage: null });

    try {
      await managedUserService.remove(userId);
      set({ users: get().users.filter((user) => user.id !== userId) });
      return true;
    } catch {
      set({ errorMessage: "Gagal menghapus pengguna." });
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
