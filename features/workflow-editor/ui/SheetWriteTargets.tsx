"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";

export interface WriteTarget {
  /** Header name of the column to write to. */
  column: string;
  /** Value template (supports {{kolom}} and {{__waMessageId}} etc). */
  value: string;
}

interface SheetWriteTargetsProps {
  availableColumns: string[];
  value: WriteTarget[];
  onChange: (next: WriteTarget[]) => void;
}

/**
 * Editor for one or more "write to column" rules used by the Sheets Update
 * node. Each rule picks a target column (by header name) and a value template,
 * e.g. write "Sudah Diingatkan" to column "Reminder", or "{{__waMessageId}}"
 * to a "Pesan ID" column.
 */
export function SheetWriteTargets({
  availableColumns,
  value,
  onChange,
}: SheetWriteTargetsProps) {
  const targets = value ?? [];

  const updateTarget = (targetIndex: number, patch: Partial<WriteTarget>) =>
    onChange(
      targets.map((target, index) =>
        index === targetIndex ? { ...target, ...patch } : target,
      ),
    );

  const addTarget = () => onChange([...targets, { column: "", value: "" }]);

  const removeTarget = (targetIndex: number) =>
    onChange(targets.filter((_, index) => index !== targetIndex));

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-xs font-medium text-muted-foreground">
        Kolom yang Ditulis
      </label>

      {targets.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Belum ada kolom. Tambahkan kolom yang ingin di-update.
        </p>
      )}

      {targets.map((target, targetIndex) => (
        <div
          key={targetIndex}
          className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-2"
        >
          <div className="flex items-center gap-2">
            <Select
              value={target.column || "_none"}
              onValueChange={(columnValue) =>
                updateTarget(targetIndex, {
                  column: columnValue === "_none" ? "" : columnValue,
                })
              }
            >
              <SelectTrigger size="sm" className="flex-1">
                <SelectValue placeholder="— pilih kolom —" />
              </SelectTrigger>

              <SelectContent>
                {availableColumns.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    Belum ada kolom
                  </SelectItem>
                ) : (
                  availableColumns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={() => removeTarget(targetIndex)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="Hapus kolom"
            >
              <Trash2Icon className="size-4" />
            </button>
          </div>

          <Input
            className="h-8 text-xs"
            placeholder="Nilai baru, mis. Sudah Diingatkan {{__waMessageId}}"
            value={target.value}
            onChange={(changeEvent) =>
              updateTarget(targetIndex, { value: changeEvent.target.value })
            }
          />
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={addTarget}
      >
        <PlusIcon className="size-4" />
        Tambah Kolom
      </Button>

      <p className="text-xs text-muted-foreground">
        Mendukung {"{{kolom}}"} dan hasil WA: {"{{__waMessageId}}"},{" "}
        {"{{__waTarget}}"}, {"{{__waSentAt}}"}.
      </p>
    </div>
  );
}
