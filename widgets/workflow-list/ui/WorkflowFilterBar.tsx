"use client";

import { SearchIcon, RotateCcwIcon } from "lucide-react";
import { Input, NativeSelect, NativeSelectOption } from "@/shared/ui";

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
        <NativeSelect
          value={filters.status}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value })
          }
          className="w-36"
        >
          <NativeSelectOption value="all">All Status</NativeSelectOption>
          <NativeSelectOption value="active">Active</NativeSelectOption>
          <NativeSelectOption value="paused">Paused</NativeSelectOption>
          <NativeSelectOption value="draft">Draft</NativeSelectOption>
        </NativeSelect>

        <NativeSelect
          value={filters.triggerType}
          onChange={(event) =>
            onChange({ ...filters, triggerType: event.target.value })
          }
          className="w-36"
        >
          <NativeSelectOption value="all">All Types</NativeSelectOption>
          <NativeSelectOption value="Cron">Cron</NativeSelectOption>
          <NativeSelectOption value="Webhook">Webhook</NativeSelectOption>
          <NativeSelectOption value="Google Sheets">
            Google Sheets
          </NativeSelectOption>
        </NativeSelect>

        <NativeSelect
          value={filters.sort}
          onChange={(event) =>
            onChange({ ...filters, sort: event.target.value })
          }
          className="w-36"
        >
          <NativeSelectOption value="latest">Latest</NativeSelectOption>
          <NativeSelectOption value="name">Name</NativeSelectOption>
          <NativeSelectOption value="executions">Executions</NativeSelectOption>
        </NativeSelect>

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
