"use client";

import { useEffect } from "react";
import { Spinner } from "@/shared/ui";
import { useManagedUserStore } from "@/entities/managed-user";
import { UserTableRow } from "./UserTableRow";
import { UserFilters } from "./UserFilters";
import { UsersPagination } from "./UsersPagination";

/**
 * Widget pengelolaan pengguna untuk admin. Pencarian, filter role & status,
 * serta paginasi dilakukan di sisi server melalui store; komponen hanya
 * merender data yang dikembalikan API.
 */
export function UserManager() {
  const {
    users,
    metadata,
    page,
    limit,
    search,
    roleFilter,
    statusFilter,
    isLoading,
    errorMessage,
    fetchUsers,
    setPage,
    setLimit,
    setSearch,
    setRoleFilter,
    setStatusFilter,
    resetFilters,
  } = useManagedUserStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="border-border bg-card flex flex-col rounded-xl border shadow-sm">
      <UserFilters
        searchTerm={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onRoleChange={setRoleFilter}
        onStatusChange={setStatusFilter}
        onReset={resetFilters}
      />

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
          Tidak ada pengguna yang cocok dengan filter.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-border text-muted-foreground border-b text-left text-xs font-semibold uppercase">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Terakhir Aktif</th>
                  <th className="px-4 py-3">Dibuat Pada</th>
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

          <UsersPagination
            totalItems={metadata.totalItems}
            currentPage={page}
            pageSize={limit}
            onPageChange={setPage}
            onPageSizeChange={setLimit}
          />
        </>
      )}
    </div>
  );
}
