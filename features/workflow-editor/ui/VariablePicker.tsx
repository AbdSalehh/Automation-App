"use client";

import { useMemo, useState } from "react";
import { BracesIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

/** A group of insertable variables shown in the picker. */
export interface VariableGroup {
  label: string;
  /** Expression tokens, e.g. "payload.Nama" or "$now". */
  variables: string[];
}

interface VariablePickerProps {
  groups: VariableGroup[];
  /** Receives the bare variable path, e.g. "payload.Nama". */
  onInsert: (variable: string) => void;
  className?: string;
}

/**
 * A popover that lists variables from previous nodes, sheet columns, and system
 * values. Clicking a variable inserts a `{{ ... }}` expression token.
 */
export function VariablePicker({
  groups,
  onInsert,
  className,
}: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return groups;
    }

    return groups
      .map((group) => ({
        ...group,
        variables: group.variables.filter((variable) =>
          variable.toLowerCase().includes(term),
        ),
      }))
      .filter((group) => group.variables.length > 0);
  }, [groups, searchTerm]);

  const handleInsert = (variable: string) => {
    onInsert(variable);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Sisipkan variabel"
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            className,
          )}
        >
          <BracesIcon className="size-3.5" />
          Variabel
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-0" align="end">
        <div className="border-b border-border p-2">
          <div className="flex items-center gap-2 rounded-md border border-border px-2">
            <SearchIcon className="size-3.5 text-muted-foreground" />

            <Input
              value={searchTerm}
              placeholder="Cari variabel…"
              onChange={(changeEvent) =>
                setSearchTerm(changeEvent.target.value)
              }
              className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto p-1">
          {filteredGroups.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              Tidak ada variabel cocok.
            </p>
          )}

          {filteredGroups.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>

              {group.variables.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => handleInsert(variable)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-muted"
                >
                  <span className="truncate font-mono">{variable}</span>
                  <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
