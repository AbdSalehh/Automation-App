"use client";

import "react-data-grid/lib/styles.css";
import { XIcon, TableIcon } from "lucide-react";
import { useMemo } from "react";
import { DataGrid } from "react-data-grid";
import { Button, Badge, Spinner } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useSheetPreviewStore } from "@/entities/workflow";

export function SpreadsheetPreviewDrawer() {
  const {
    data,
    isLoading,
    errorMessage,
    isOpen,
    sheetList,
    activeSheet,
    setActiveSheet,
    closeDrawer,
  } = useSheetPreviewStore();

  const columns = useMemo(
    () =>
      (data?.headers ?? []).map((header) => ({
        key: header,
        name: header,
        resizable: true,
        minWidth: 100,
      })),
    [data?.headers],
  );

  const rows = useMemo(
    () =>
      (data?.rows ?? []).map((row) => {
        const rowObject: Record<string, string> = {};

        (data?.headers ?? []).forEach((header, index) => {
          rowObject[header] = row[index] ?? "";
        });

        return rowObject;
      }),
    [data?.rows, data?.headers],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      aria-modal="true"
      role="dialog"
      aria-label="Spreadsheet Preview"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeDrawer}
      />

      {/* Drawer panel */}
      <div className="relative flex h-[64vh] flex-col rounded-t-2xl border-t border-border bg-card shadow-2xl">
        {/* Drag handle */}
        <div className="mx-auto mt-2 h-1 w-12 shrink-0 rounded-full bg-border" />

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <TableIcon className="size-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Data Preview
            </span>

            {data && (
              <Badge variant="neutral">
                {data.totalRows.toLocaleString()} baris
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={closeDrawer}
            aria-label="Tutup preview"
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        {/* Sheet tabs */}
        {sheetList.length > 1 && (
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-muted/30 px-4 py-1.5">
            {sheetList.map((sheetName) => (
              <button
                key={sheetName}
                type="button"
                onClick={() => setActiveSheet(sheetName)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  activeSheet === sheetName
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {sheetName}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        {isLoading && (
          <div className="grid flex-1 place-items-center">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Memuat data…
            </span>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="grid flex-1 place-items-center p-6">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        )}

        {!isLoading && data && columns.length > 0 && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left metadata panel */}
            <div className="flex w-52 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border p-4">
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Sheet Aktif
                </p>
                <p className="truncate text-sm font-medium text-foreground">
                  {activeSheet || "Sheet1"}
                </p>
              </div>

              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Total Baris
                </p>
                <p className="text-sm font-medium text-foreground">
                  {data.totalRows.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <Badge variant="success">Connected</Badge>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Kolom ({data.headers.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.headers.map((header) => (
                    <span
                      key={header}
                      className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {header}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Data grid */}
            <div className="flex-1 overflow-hidden">
              <DataGrid
                columns={columns}
                rows={rows}
                className="h-full rdg-light"
                rowHeight={34}
                headerRowHeight={36}
                style={{ blockSize: "100%" }}
              />
            </div>
          </div>
        )}

        {!isLoading && data && columns.length === 0 && (
          <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
            Sheet kosong atau tidak memiliki header.
          </div>
        )}
      </div>
    </div>
  );
}
