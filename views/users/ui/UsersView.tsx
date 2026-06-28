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
import Image from "next/image";

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
      <header className="border-border/50 bg-card/50 fill-mode-backwards relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="from-primary/3 absolute inset-0 bg-linear-to-br to-transparent" />
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            User Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage users, assign roles, and control access to the platform with
            ease.
          </p>
        </div>

        <div className="absolute right-40 size-70">
          <Image
            alt=""
            width={500}
            height={500}
            className="h-full! w-full! object-contain"
            src="/contact.webp"
          />
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 bg-orange-400!"
        >
          <UserPlusIcon className="size-4" />
          Add User
        </Button>
      </header>

      <UserStatsCards users={users} />

      <UserManager />

      <UsersSecurityBanner />

      <CreateUserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
