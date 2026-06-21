"use client";

import { SearchIcon, RotateCcwIcon } from "lucide-react";
import { Input, Button } from "@/shared/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";

export type RoleFilter = "all" | "user" | "admin";
export type StatusFilter =
  | "all"
  | "active"
  | "inactive"
  | "pending"
  | "rejected"
  | "locked";

interface UserFiltersProps {
  searchTerm: string;
  roleFilter: RoleFilter;
  statusFilter: StatusFilter;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: RoleFilter) => void;
  onStatusChange: (value: StatusFilter) => void;
  onReset: () => void;
}

/**
 * Bar filter daftar pengguna: pencarian nama/email, filter role, filter status,
 * dan tombol reset. State filter dikelola oleh komponen induk.
 */
export function UserFilters({
  searchTerm,
  roleFilter,
  statusFilter,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onReset,
}: UserFiltersProps) {
  return (
    <div className="border-border flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchTerm}
          onChange={(changeEvent) => onSearchChange(changeEvent.target.value)}
          placeholder="Cari nama, email, atau role..."
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={roleFilter}
          onValueChange={(value) => onRoleChange(value as RoleFilter)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Semua Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => onStatusChange(value as StatusFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Non-Aktif</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
            <SelectItem value="locked">Terkunci</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
          <RotateCcwIcon className="size-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}
