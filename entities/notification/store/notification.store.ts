import { create } from "zustand";
import { notificationService } from "../service/notification.service";
import type { AppNotification } from "../model/notification.model";

interface NotificationState {
  notifications: AppNotification[];
  isLoading: boolean;
  errorMessage: string | null;

  fetchNotifications: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

/**
 * Store notifikasi per-pengguna. Memuat daftar dan menandai notifikasi sebagai
 * sudah dibaca (satu per satu atau semua). Hitungan belum dibaca diturunkan di
 * komponen dari daftar agar tidak ada state duplikat.
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,
  errorMessage: null,

  fetchNotifications: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const notifications = await notificationService.list();
      set({ notifications });
    } catch {
      set({ errorMessage: "Gagal memuat notifikasi." });
    } finally {
      set({ isLoading: false });
    }
  },

  markRead: async (notificationId) => {
    /** Optimistik: tandai dibaca di UI lebih dulu agar terasa responsif. */
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    }));

    try {
      await notificationService.markRead(notificationId);
    } catch {
      get().fetchNotifications();
    }
  },

  markAllRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    }));

    try {
      await notificationService.markAllRead();
    } catch {
      get().fetchNotifications();
    }
  },
}));
