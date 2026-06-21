"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  BellIcon,
  CheckCheckIcon,
  CheckCircle2Icon,
  XCircleIcon,
  UserPlusIcon,
  KeyRoundIcon,
  InfoIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Spinner } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import {
  useNotificationStore,
  type AppNotification,
} from "@/entities/notification";

/** Ikon dan warna aksen per jenis notifikasi. */
const TYPE_VISUALS: Record<
  string,
  { icon: typeof InfoIcon; className: string }
> = {
  workflow_success: {
    icon: CheckCircle2Icon,
    className: "text-emerald-500",
  },
  workflow_failed: { icon: XCircleIcon, className: "text-red-500" },
  account_approved: {
    icon: CheckCircle2Icon,
    className: "text-emerald-500",
  },
  account_pending: { icon: UserPlusIcon, className: "text-amber-500" },
  credential_failed: { icon: KeyRoundIcon, className: "text-red-500" },
  system: { icon: InfoIcon, className: "text-sky-500" },
};

/** Format waktu relatif ringkas dalam Bahasa Indonesia. */
function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Baru saja";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return `${diffDays} hari lalu`;
}

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (notificationId: string) => void;
}

function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const visuals = TYPE_VISUALS[notification.type] ?? TYPE_VISUALS.system;
  const ItemIcon = visuals.icon;

  const content = (
    <div
      className={cn(
        "flex gap-3 px-3 py-2.5 transition-colors",
        notification.isRead ? "opacity-65" : "bg-accent/40",
      )}
    >
      <span className={cn("mt-0.5 shrink-0", visuals.className)}>
        <ItemIcon className="size-4" />
      </span>

      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-foreground text-sm font-medium">
          {notification.title}
        </span>

        {notification.body && (
          <span className="text-muted-foreground line-clamp-2 text-xs">
            {notification.body}
          </span>
        )}

        <span className="text-muted-foreground mt-0.5 text-[11px]">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </div>

      {!notification.isRead && (
        <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
      )}
    </div>
  );

  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
  };

  if (notification.link) {
    return (
      <Link
        href={notification.link}
        onClick={handleClick}
        className="hover:bg-accent block"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="hover:bg-accent w-full text-left"
    >
      {content}
    </button>
  );
}

/**
 * Lonceng notifikasi di header. Memuat notifikasi saat dipasang, menampilkan
 * jumlah belum dibaca, dan membuka popover berisi daftar dengan aksi "tandai
 * semua dibaca".
 */
export function NotificationBell() {
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifikasi"
          className="text-muted-foreground hover:bg-accent hover:text-foreground relative grid size-8 place-items-center rounded-full outline-hidden transition-colors"
        >
          <BellIcon className="size-5" />

          {unreadCount > 0 && (
            <span className="ring-background absolute top-1 right-1.5 grid size-3 place-items-center rounded-full bg-orange-500 text-[9px] font-bold text-white ring-2">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-border flex items-center justify-between border-b px-3 py-2.5">
          <span className="text-foreground text-sm font-semibold">
            Notifikasi
          </span>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-primary flex items-center gap-1 text-xs hover:underline"
            >
              <CheckCheckIcon className="size-3.5" />
              Tandai semua
            </button>
          )}
        </div>

        <div className="divide-border max-h-96 divide-y overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-muted-foreground px-3 py-8 text-center text-sm">
              Belum ada notifikasi.
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={markRead}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
