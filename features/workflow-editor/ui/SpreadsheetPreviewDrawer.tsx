"use client";

import "jspreadsheet-ce/dist/jspreadsheet.css";
import "jsuites/dist/jsuites.css";
import { XIcon, TableIcon, GripHorizontalIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button, Badge, Spinner, ScrollArea } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useSheetPreviewStore } from "@/entities/workflow";

/** Min / max drawer height as a fraction of the viewport. */
const MIN_HEIGHT_VH = 30;
const MAX_HEIGHT_VH = 92;
const DEFAULT_HEIGHT_VH = 64;

/**
 * Converts a zero-based column index to a spreadsheet column letter.
 * 0 -> A, 25 -> Z, 26 -> AA, etc.
 */
function indexToColumnLetter(index: number): string {
  let result = "";
  let cursor = index;

  while (cursor >= 0) {
    result = String.fromCharCode((cursor % 26) + 65) + result;
    cursor = Math.floor(cursor / 26) - 1;
  }

  return result;
}

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

  const [heightVh, setHeightVh] = useState(DEFAULT_HEIGHT_VH);

  const gridContainerRef = useRef<HTMLDivElement>(null);

  /** Holds the jspreadsheet module so cleanup can call its static destroy. */
  const jspreadsheetModuleRef = useRef<{
    destroy?: (element: HTMLElement) => void;
  } | null>(null);

  /** Pointer-drag the top handle to resize the drawer height. */
  const handleResizeStart = useCallback((startEvent: React.PointerEvent) => {
    startEvent.preventDefault();

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const fromBottom = window.innerHeight - moveEvent.clientY;
      const nextVh = (fromBottom / window.innerHeight) * 100;

      setHeightVh(Math.min(MAX_HEIGHT_VH, Math.max(MIN_HEIGHT_VH, nextVh)));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }, []);

  /** Render the read-only jspreadsheet grid whenever data changes. */
  useEffect(() => {
    if (!isOpen || !data || data.headers.length === 0) {
      return;
    }

    let isCancelled = false;
    const gridElement = gridContainerRef.current;

    const renderGrid = async () => {
      const jspreadsheetModule = await import("jspreadsheet-ce");
      const jspreadsheet = jspreadsheetModule.default;

      jspreadsheetModuleRef.current =
        jspreadsheet as unknown as typeof jspreadsheetModuleRef.current;

      if (isCancelled || !gridElement) {
        return;
      }

      /** Clear any previous instance before re-rendering. */
      gridElement.innerHTML = "";

      /**
       * Show spreadsheet-native column letters (A, B, C…) as the column
       * headers and the user's real header row as the first data row, so both
       * the sheet position and the named columns are visible.
       */
      const gridData = [data.headers, ...data.rows];

      jspreadsheet(gridElement, {
        worksheets: [
          {
            data: gridData.length > 0 ? gridData : [[]],
            columns: data.headers.map((_, columnIndex) => ({
              title: indexToColumnLetter(columnIndex),
              width: 160,
              readOnly: true,
            })),
            minDimensions: [data.headers.length, 1],
            editable: false,
            allowInsertRow: false,
            allowInsertColumn: false,
            allowDeleteRow: false,
            allowDeleteColumn: false,
            allowRenameColumn: false,
            columnSorting: true,
            columnResize: true,
            tableOverflow: true,
          },
        ],
        contextMenu: () => [],
      });
    };

    renderGrid();

    return () => {
      isCancelled = true;

      if (gridElement) {
        jspreadsheetModuleRef.current?.destroy?.(gridElement);
        gridElement.innerHTML = "";
      }
    };
  }, [isOpen, data]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          aria-modal="true"
          role="dialog"
          aria-label="Spreadsheet Preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          {/* Drawer panel */}
          <motion.div
            className="border-border bg-card relative flex flex-col rounded-t-xl border-t shadow-2xl"
            style={{ height: `${heightVh}vh` }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Resize handle */}
            <div
              onPointerDown={handleResizeStart}
              className="group flex h-5 shrink-0 cursor-ns-resize touch-none items-center justify-center"
              aria-label="Resize panel"
            >
              <GripHorizontalIcon className="text-border group-hover:text-muted-foreground size-4 transition-colors" />
            </div>

            {/* Header */}
            <div className="border-border flex shrink-0 items-center justify-between border-b px-5 py-3">
              <div className="flex items-center gap-2">
                <TableIcon className="text-primary size-4" />
                <span className="text-foreground text-sm font-semibold">
                  Data Preview
                </span>

                {data && (
                  <Badge variant="neutral">
                    {data.totalRows.toLocaleString()} rows
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={closeDrawer}
                aria-label="Close preview"
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            {/* Sheet tabs */}
            {sheetList.length > 0 && (
              <div className="border-border bg-muted/30 flex shrink-0 gap-1 overflow-x-auto border-b px-4 py-1.5">
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
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Spinner /> Loading data…
                </span>
              </div>
            )}

            {!isLoading && errorMessage && (
              <div className="grid flex-1 place-items-center p-6">
                <p className="text-destructive text-sm">{errorMessage}</p>
              </div>
            )}

            {!isLoading && data && data.headers.length > 0 && (
              <div className="flex flex-1 overflow-hidden">
                {/* Left metadata panel */}
                <ScrollArea className="border-border w-52 shrink-0 border-r">
                  <div className="flex flex-col gap-4 p-4">
                    <div>
                      <p className="text-muted-foreground mb-0.5 text-[10px] font-semibold tracking-wide uppercase">
                        Active Sheet
                      </p>
                      <p className="text-foreground truncate text-sm font-medium">
                        {activeSheet || "Sheet1"}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-0.5 text-[10px] font-semibold tracking-wide uppercase">
                        Total Rows
                      </p>
                      <p className="text-foreground text-sm font-medium">
                        {data.totalRows.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-0.5 text-[10px] font-semibold tracking-wide uppercase">
                        Status
                      </p>
                      <Badge variant="success">View Only</Badge>
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wide uppercase">
                        Columns ({data.headers.length})
                      </p>
                      <div className="flex flex-col gap-1">
                        {data.headers.map((header, columnIndex) => (
                          <div
                            key={header}
                            className="bg-muted flex items-center gap-2 rounded-md px-2 py-1 text-[11px]"
                          >
                            <span className="bg-card text-muted-foreground grid size-4 shrink-0 place-items-center rounded font-mono text-[10px] font-semibold">
                              {indexToColumnLetter(columnIndex)}
                            </span>
                            <span className="text-foreground truncate">
                              {header}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* jspreadsheet grid (view-only) */}
                <div className="flex-1 overflow-auto p-2">
                  <div ref={gridContainerRef} />
                </div>
              </div>
            )}

            {!isLoading && data && data.headers.length === 0 && (
              <div className="text-muted-foreground grid flex-1 place-items-center text-sm">
                Sheet is empty or has no header.
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
