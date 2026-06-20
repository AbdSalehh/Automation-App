"use client";

import { SearchIcon, RotateCcwIcon } from "lucide-react";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";

export interface WorkflowFilters {
  search: string;
  status: string;
  triggerType: string;
  sort: string;
}

interface WorkflowFilterBarProps {
  filters: WorkflowFilters;
  onChange: (filters: WorkflowFilters) => void;
  onClear: () => void;
}

/** Bar filter tabel workflows: cari, status, trigger, dan urutan (gambar 2). */
export function WorkflowFilterBar({
  filters,
  onChange,
  onClear,
}: WorkflowFilterBarProps) {
  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          placeholder="Search workflows..."
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.triggerType}
          onValueChange={(value) =>
            onChange({ ...filters, triggerType: value })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Cron">Cron</SelectItem>
            <SelectItem value="Webhook">Webhook</SelectItem>
            <SelectItem value="Google Sheets">Google Sheets</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(value) => onChange({ ...filters, sort: value })}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="executions">Executions</SelectItem>
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={onClear}
          className="border-border text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm"
        >
          <RotateCcwIcon className="size-3.5" />
          Clear filters
        </button>
      </div>
    </div>
  );
}
