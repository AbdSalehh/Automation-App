"use client";

import { useState } from "react";
import { UserPlusIcon } from "lucide-react";
import { Button } from "@/shared/ui";
import { useManagedUserStore } from "@/entities/managed-user";
import {
  UserManager,
  UserStatsCards,
  CreateUserDialog,
  UsersSecurityBanner,
} from "@/widgets/user-manager";

/**
 * Halaman pengelolaan pengguna untuk admin: hero header, kartu statistik nyata,
 * tabel terfilter, dan banner keamanan. State daftar diambil dari store agar
 * kartu statistik dan tabel konsisten.
 */
export function UsersView() {
  const { users } = useManagedUserStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <header className="border-border relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-gradient-to-r from-orange-50 via-amber-50/40 to-transparent p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Manajemen Users
          </h1>
          <p className="text-muted-foreground text-sm">
            Kelola pengguna, atur peran, dan kontrol akses ke platform dengan
            mudah.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <UserPlusIcon className="size-4" />
          Tambah User
        </Button>
      </header>

      <UserStatsCards users={users} />

      <UserManager />

      <UsersSecurityBanner />

      <CreateUserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
