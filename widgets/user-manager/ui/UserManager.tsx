"use client";

import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@/shared/ui";
import { useManagedUserStore } from "@/entities/managed-user";
import type { ManagedUser } from "@/entities/managed-user";
import { UserTableRow } from "./UserTableRow";
import { UserFilters, type RoleFilter, type StatusFilter } from "./UserFilters";
import { UsersPagination } from "./UsersPagination";

const DEFAULT_PAGE_SIZE = 5;

/**
 * Mencocokkan satu pengguna dengan filter status terpilih.
 */
function matchesStatus(user: ManagedUser, statusFilter: StatusFilter): boolean {
  switch (statusFilter) {
    case "active":
      return user.approvalStatus === "approved" && user.isActive;
    case "inactive":
      return !user.isActive;
    case "pending":
      return user.approvalStatus === "pending";
    case "rejected":
      return user.approvalStatus === "rejected";
    case "locked":
      return user.isLocked;
    default:
      return true;
  }
}

/**
 * Widget pengelolaan pengguna untuk admin. Menerapkan pencarian, filter role &
 * status, lalu paginasi client-side atas daftar yang diambil dari store.
 */
export function UserManager() {
  const { users, isLoading, errorMessage, fetchUsers } = useManagedUserStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        (user.name ?? "").toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.role.toLowerCase().includes(normalizedSearch);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole && matchesStatus(user, statusFilter);
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  /**
   * Kembali ke halaman pertama setiap kali hasil filter berubah agar paginasi
   * tidak menunjuk halaman yang sudah tidak ada.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, pageSize]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handleReset = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="border-border bg-card flex flex-col rounded-xl border shadow-sm">
      <UserFilters
        searchTerm={searchTerm}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onRoleChange={setRoleFilter}
        onStatusChange={setStatusFilter}
        onReset={handleReset}
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
      ) : filteredUsers.length === 0 ? (
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
                {paginatedUsers.map((user) => (
                  <UserTableRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>

          <UsersPagination
            totalItems={filteredUsers.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  );
}
