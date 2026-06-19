"use client";

import { SearchIcon } from "lucide-react";
import { Input, NativeSelect, NativeSelectOption } from "@/shared/ui";

export interface CredentialFilters {
  search: string;
  type: string;
  status: string;
  sort: string;
}

interface CredentialFilterBarProps {
  filters: CredentialFilters;
  onChange: (filters: CredentialFilters) => void;
}

/** Bar filter tabel credentials: cari, tipe, status, dan urutan (gambar 1). */
export function CredentialFilterBar({
  filters,
  onChange,
}: CredentialFilterBarProps) {
  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          placeholder="Search credentials..."
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          value={filters.type}
          onChange={(event) =>
            onChange({ ...filters, type: event.target.value })
          }
          className="w-36"
        >
          <NativeSelectOption value="all">All Types</NativeSelectOption>
          <NativeSelectOption value="WhatsApp">WhatsApp</NativeSelectOption>
          <NativeSelectOption value="Gmail">Gmail</NativeSelectOption>
          <NativeSelectOption value="Google Sheets">
            Google Sheets
          </NativeSelectOption>
          <NativeSelectOption value="Telegram">Telegram</NativeSelectOption>
        </NativeSelect>

        <NativeSelect
          value={filters.status}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value })
          }
          className="w-36"
        >
          <NativeSelectOption value="all">All Status</NativeSelectOption>
          <NativeSelectOption value="active">Active</NativeSelectOption>
          <NativeSelectOption value="expired">Expired</NativeSelectOption>
        </NativeSelect>

        <NativeSelect
          value={filters.sort}
          onChange={(event) =>
            onChange({ ...filters, sort: event.target.value })
          }
          className="w-40"
        >
          <NativeSelectOption value="name">Name (A-Z)</NativeSelectOption>
          <NativeSelectOption value="latest">Latest</NativeSelectOption>
        </NativeSelect>
      </div>
    </div>
  );
}
