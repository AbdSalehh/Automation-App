"use client";

import { ShieldCheckIcon, UserIcon, LockIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import type { ManagedUser } from "@/entities/managed-user";
import { UserRowActions } from "./UserRowActions";

interface UserTableRowProps {
  user: ManagedUser;
}

/**
 * Format tanggal lengkap ke dua baris: tanggal lokal dan jam (WIB).
 */
function formatDateTime(value: string): { date: string; time: string } {
  const parsed = new Date(value);

  const date = parsed.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const time = parsed.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return { date, time: `${time} WIB` };
}

/**
 * Format aktivitas terakhir menjadi keterangan relatif yang ramah dibaca.
 * Mengembalikan `null` bila pengguna belum pernah tercatat aktif.
 */
function formatLastSeen(value: string | null): {
  label: string;
  isOnline: boolean;
} | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 5) {
    return { label: "Sekarang", isOnline: true };
  }

  if (diffMinutes < 60) {
    return { label: `${diffMinutes} menit yang lalu`, isOnline: false };
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return { label: `${diffHours} jam yang lalu`, isOnline: false };
  }

  const diffDays = Math.floor(diffHours / 24);

  return { label: `${diffDays} hari yang lalu`, isOnline: false };
}

/** Satu baris tabel pengguna untuk pengelolaan oleh admin. */
export function UserTableRow({ user }: UserTableRowProps) {
  const isAdmin = user.role === "admin";

  const initials = user.name
    ? user.name.slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  const createdAt = formatDateTime(user.createdAt);
  const lastSeen = formatLastSeen(user.lastSeenAt);

  return (
    <tr className="border-border hover:bg-accent/40 border-b last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={user.image ?? undefined} alt={user.email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="text-foreground truncate text-sm font-semibold">
              {user.name || "Tanpa Nama"}
            </span>
            <span className="text-muted-foreground truncate text-xs">
              {user.email}
            </span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <Badge variant={isAdmin ? "warning" : "neutral"} className="gap-1">
          {isAdmin ? (
            <ShieldCheckIcon className="size-3" />
          ) : (
            <UserIcon className="size-3" />
          )}
          {isAdmin ? "Admin" : "User"}
        </Badge>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {user.approvalStatus === "pending" && (
            <Badge variant="warning">Menunggu</Badge>
          )}

          {user.approvalStatus === "rejected" && (
            <Badge variant="destructive">Ditolak</Badge>
          )}

          {user.approvalStatus === "approved" && (
            <Badge variant={user.isActive ? "success" : "neutral"}>
              {user.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
          )}

          {user.isLocked && (
            <Badge variant="destructive" className="gap-1">
              <LockIcon className="size-3" />
              Terkunci
            </Badge>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        {lastSeen ? (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                lastSeen.isOnline ? "bg-emerald-500" : "bg-gray-300",
              )}
            />
            <span className="text-muted-foreground text-sm">
              {lastSeen.label}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground/60 text-sm">Belum pernah</span>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-foreground text-sm">{createdAt.date}</span>
          <span className="text-muted-foreground text-xs">
            {createdAt.time}
          </span>
        </div>
      </td>

      <td className="px-4 py-3 text-right">
        <UserRowActions user={user} />
      </td>
    </tr>
  );
}
