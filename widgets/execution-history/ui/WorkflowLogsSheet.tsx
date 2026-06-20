"use client";

import { useEffect, useState } from "react";
import { ScrollTextIcon } from "lucide-react";
import { Badge, Spinner, Button } from "@/shared/ui";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/shared/ui/sheet";
import { formatDateTime, formatDuration } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/utils";
import { useExecutionStore } from "@/entities/execution";

interface WorkflowLogsSheetProps {
  workflowId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_BADGE_VARIANT = {
  success: "success",
  failed: "destructive",
  running: "warning",
} as const;

/**
 * Sheet log per-workflow yang dibuka dari editor. Memuat riwayat eksekusi
 * khusus satu workflow lalu menampilkan node log saat sebuah baris dipilih.
 */
export function WorkflowLogsSheet({
  workflowId,
  open,
  onOpenChange,
}: WorkflowLogsSheetProps) {
  const {
    executions,
    isLoading,
    selectedDetail: detail,
    isLoadingDetail,
    fetchExecutions,
    fetchExecutionDetail,
    clearDetail,
  } = useExecutionStore();

  const [openExecutionId, setOpenExecutionId] = useState<string | null>(null);

  /** Muat ulang riwayat tiap kali sheet dibuka agar selalu terkini. */
  useEffect(() => {
    if (open && workflowId) {
      fetchExecutions(workflowId);
    }
  }, [open, workflowId, fetchExecutions]);

  const toggleDetail = (executionId: string) => {
    if (openExecutionId === executionId) {
      setOpenExecutionId(null);
      clearDetail();

      return;
    }

    setOpenExecutionId(executionId);
    fetchExecutionDetail(executionId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="border-border border-b">
          <SheetTitle className="flex items-center gap-2">
            <ScrollTextIcon className="size-4" />
            Logs Workflow
          </SheetTitle>
          <SheetDescription>
            Riwayat eksekusi dan log node untuk workflow ini.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <span className="text-muted-foreground flex items-center gap-2 text-sm">
              <Spinner /> Memuat…
            </span>
          ) : executions.length === 0 ? (
            <div className="border-border text-muted-foreground rounded-xl border border-dashed py-12 text-center text-sm">
              Belum ada eksekusi untuk workflow ini.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {executions.map((execution) => (
                <li
                  key={execution.id}
                  className="border-border bg-card overflow-hidden rounded-lg border"
                >
                  <button
                    type="button"
                    onClick={() => toggleDetail(execution.id)}
                    className="hover:bg-accent/40 flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="text-foreground text-sm font-medium">
                        {formatDateTime(execution.startedAt)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Durasi{" "}
                        {formatDuration(
                          execution.startedAt,
                          execution.finishedAt,
                        )}
                      </span>
                    </div>

                    <Badge variant={STATUS_BADGE_VARIANT[execution.status]}>
                      {execution.status}
                    </Badge>
                  </button>

                  {openExecutionId === execution.id && (
                    <div className="border-border bg-muted/40 border-t px-3 py-2.5">
                      {isLoadingDetail || !detail ? (
                        <span className="text-muted-foreground flex items-center gap-2 text-xs">
                          <Spinner /> Memuat log…
                        </span>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <p className="text-muted-foreground text-xs font-semibold">
                            Node Logs
                          </p>

                          <ul className="space-y-1.5 font-mono text-xs">
                            {detail.nodeLogs.map((nodeLog) => (
                              <li
                                key={nodeLog.id}
                                className="flex items-center gap-2"
                              >
                                <Badge
                                  variant={
                                    nodeLog.status === "success"
                                      ? "success"
                                      : nodeLog.status === "failed"
                                        ? "destructive"
                                        : "info"
                                  }
                                >
                                  {nodeLog.status}
                                </Badge>
                                <span className="text-muted-foreground truncate">
                                  {nodeLog.nodeId}
                                </span>
                              </li>
                            ))}
                          </ul>

                          {detail.logs.length > 0 && (
                            <>
                              <p className="text-muted-foreground mt-2 text-xs font-semibold">
                                Runtime Logs
                              </p>
                              <ul className="space-y-1 font-mono text-xs">
                                {detail.logs.map((logEntry) => (
                                  <li
                                    key={logEntry.id}
                                    className={cn(
                                      logEntry.level === "error"
                                        ? "text-destructive"
                                        : logEntry.level === "warn"
                                          ? "text-amber-600"
                                          : "text-muted-foreground",
                                    )}
                                  >
                                    {logEntry.message}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
