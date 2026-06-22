import { create } from "zustand";
import { managedUserService } from "../service/managed-user.service";
import type { PaginationMeta } from "@/shared/api/http";
import type {
  ManagedUser,
  CreateUserPayload,
  RoleFilter,
  StatusFilter,
} from "../model/managed-user.model";

const DEFAULT_METADATA: PaginationMeta = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
};

interface ManagedUserState {
  users: ManagedUser[];
  metadata: PaginationMeta;
  page: number;
  limit: number;
  search: string;
  roleFilter: RoleFilter;
  statusFilter: StatusFilter;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  fetchUsers: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setRoleFilter: (roleFilter: RoleFilter) => void;
  setStatusFilter: (statusFilter: StatusFilter) => void;
  resetFilters: () => void;
  createUser: (payload: CreateUserPayload) => Promise<boolean>;
  resetPassword: (userId: string, password: string) => Promise<boolean>;
  approveUser: (userId: string) => Promise<boolean>;
  rejectUser: (userId: string) => Promise<boolean>;
  unlockUser: (userId: string) => Promise<boolean>;
  setUserActive: (userId: string, isActive: boolean) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
}

export const useManagedUserStore = create<ManagedUserState>((set, get) => ({
  users: [],
  metadata: DEFAULT_METADATA,
  page: 1,
  limit: 10,
  search: "",
  roleFilter: "all",
  statusFilter: "all",
  isLoading: false,
  isSubmitting: false,
  errorMessage: null,

  fetchUsers: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const { page, limit, search, roleFilter, statusFilter } = get();

      const { users, metadata } = await managedUserService.list({
        page,
        limit,
        search,
        role: roleFilter,
        status: statusFilter,
      });

      set({ users, metadata });
    } catch {
      set({ errorMessage: "Gagal memuat daftar pengguna." });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Setter paginasi & filter. Perubahan filter selalu mengembalikan ke halaman
   * pertama agar tidak menunjuk halaman yang sudah tidak relevan, lalu memuat
   * ulang data dari server.
   */
  setPage: (page) => {
    set({ page });
    get().fetchUsers();
  },

  setLimit: (limit) => {
    set({ limit, page: 1 });
    get().fetchUsers();
  },

  setSearch: (search) => {
    set({ search, page: 1 });
    get().fetchUsers();
  },

  setRoleFilter: (roleFilter) => {
    set({ roleFilter, page: 1 });
    get().fetchUsers();
  },

  setStatusFilter: (statusFilter) => {
    set({ statusFilter, page: 1 });
    get().fetchUsers();
  },

  resetFilters: () => {
    set({ search: "", roleFilter: "all", statusFilter: "all", page: 1 });
    get().fetchUsers();
  },

  createUser: async (payload) => {
    set({ isSubmitting: true, errorMessage: null });

    try {
      const createdUser = await managedUserService.create(payload);
      set({ users: [createdUser, ...get().users] });
      return true;
    } catch {
      set({ errorMessage: "Gagal membuat pengguna baru." });
      return false;
    } finally {
      set({ isSubmitting: false });
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

  setUserActive: async (userId, isActive) => {
    set({ isSubmitting: true, errorMessage: null });

    try {
      const updatedUser = await managedUserService.setActive(userId, isActive);

      set({
        users: get().users.map((user) =>
          user.id === userId ? updatedUser : user,
        ),
      });

      return true;
    } catch {
      set({
        errorMessage: isActive
          ? "Gagal mengaktifkan pengguna."
          : "Gagal menonaktifkan pengguna.",
      });
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
