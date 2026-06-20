"use client";

import { useEffect } from "react";
import { UsersIcon } from "lucide-react";
import { Spinner } from "@/shared/ui";
import { useManagedUserStore } from "@/entities/managed-user";
import { UserTableRow } from "./UserTableRow";

/**
 * Widget pengelolaan pengguna untuk admin. Menampilkan daftar user dalam tabel
 * lengkap dengan aksi reset password dan hapus. Seluruh state diambil dari
 * store `useManagedUserStore`.
 */
export function UserManager() {
  const { users, isLoading, errorMessage, fetchUsers } = useManagedUserStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="border-border bg-card flex flex-col rounded-xl border shadow-sm">
      <div className="border-border flex items-center justify-between gap-4 border-b p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <UsersIcon className="size-5" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-foreground text-base font-bold">
              Manajemen Pengguna
            </h2>
            <p className="text-muted-foreground text-xs">
              Kelola pengguna yang terdaftar: reset password atau hapus akun.
            </p>
          </div>
        </div>

        <span className="text-muted-foreground text-sm font-medium">
          {users.length} pengguna
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-16">
          <Spinner className="text-muted-foreground size-6" />
          <span className="text-muted-foreground text-sm">
            Memuat daftar pengguna...
          </span>
        </div>
      ) : errorMessage ? (
        <div className="text-destructive py-16 text-center text-sm">
          {errorMessage}
        </div>
      ) : users.length === 0 ? (
        <div className="text-muted-foreground py-16 text-center text-sm">
          Belum ada pengguna terdaftar.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-border text-muted-foreground border-b text-left text-xs font-semibold uppercase">
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Bergabung</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserTableRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
