"use client";

import { ShieldCheckIcon, UserIcon, LockIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui";
import type { ManagedUser } from "@/entities/managed-user";
import { UserRowActions } from "./UserRowActions";

interface UserTableRowProps {
  user: ManagedUser;
}

/**
 * Format tanggal bergabung ke format lokal Indonesia yang ringkas.
 */
function formatJoinDate(value: string): string {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Satu baris tabel pengguna untuk pengelolaan oleh admin. */
export function UserTableRow({ user }: UserTableRowProps) {
  const isAdmin = user.role === "admin";

  const initials = user.name
    ? user.name.slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

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
        <span className="text-muted-foreground text-sm">
          {formatJoinDate(user.createdAt)}
        </span>
      </td>

      <td className="px-4 py-3 text-right">
        <UserRowActions user={user} />
      </td>
    </tr>
  );
}
