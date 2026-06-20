"use client";

import { SearchIcon } from "lucide-react";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";

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
        <Select
          value={filters.type}
          onValueChange={(value) => onChange({ ...filters, type: value })}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
            <SelectItem value="Gmail">Gmail</SelectItem>
            <SelectItem value="Google Sheets">Google Sheets</SelectItem>
            <SelectItem value="Telegram">Telegram</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => onChange({ ...filters, status: value })}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(value) => onChange({ ...filters, sort: value })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="latest">Latest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
