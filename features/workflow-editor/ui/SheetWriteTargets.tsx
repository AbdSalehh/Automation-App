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
  /** When true, append after existing cell content using a comma separator. */
  append?: boolean;
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
      <label className="text-muted-foreground block text-xs font-medium">
        Kolom yang Ditulis
      </label>

      {targets.length === 0 && (
        <p className="text-muted-foreground text-xs">
          Belum ada kolom. Tambahkan kolom yang ingin di-update.
        </p>
      )}

      {targets.map((target, targetIndex) => (
        <div
          key={targetIndex}
          className="border-border bg-muted/30 flex flex-col gap-2 rounded-md border p-2"
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
              className="text-muted-foreground hover:text-destructive shrink-0"
              aria-label="Hapus kolom"
            >
              <Trash2Icon className="size-4" />
            </button>
          </div>

          <Input
            className="h-8 text-xs"
            placeholder="Nilai baru, mis. {{message}} ({{__replyAt}})"
            value={target.value}
            onChange={(changeEvent) =>
              updateTarget(targetIndex, { value: changeEvent.target.value })
            }
          />

          <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              className="border-border size-3.5 rounded"
              checked={Boolean(target.append)}
              onChange={(changeEvent) =>
                updateTarget(targetIndex, {
                  append: changeEvent.target.checked,
                })
              }
            />
            Tambahkan setelah data lama (pakai koma)
          </label>
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

      <p className="text-muted-foreground text-xs">
        Mendukung {"{{kolom}}"}, hasil WA ({"{{__waMessageId}}"},{" "}
        {"{{__waTarget}}"}, {"{{__waSentAt}}"}) dan waktu balasan{" "}
        {"{{__replyAt}}"}.
      </p>
    </div>
  );
}
