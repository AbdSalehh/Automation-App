"use client";

import { useEffect } from "react";
import { XIcon } from "lucide-react";
import { Badge, Spinner } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { formatDateTime } from "@/shared/lib/formatDate";
import { useExecutionStore } from "@/entities/execution";

const STATUS_BADGE_VARIANT = {
  success: "success",
  failed: "destructive",
  running: "warning",
} as const;

const LEVEL_TEXT_STYLE = {
  info: "text-muted-foreground",
  warn: "text-amber-600",
  error: "text-destructive",
} as const;

interface ExecutionResultPanelProps {
  executionId: string;
  onClose: () => void;
}

export function ExecutionResultPanel({
  executionId,
  onClose,
}: ExecutionResultPanelProps) {
  const {
    selectedDetail: detail,
    isLoadingDetail,
    fetchExecutionDetail,
    clearDetail,
  } = useExecutionStore();

  useEffect(() => {
    fetchExecutionDetail(executionId);

    return () => clearDetail();
  }, [executionId, fetchExecutionDetail, clearDetail]);

  return (
    <div className="border-border bg-card flex h-56 shrink-0 flex-col border-t">
      <div className="border-border flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-sm font-semibold">
            Execution Result
          </span>

          {detail && (
            <Badge variant={STATUS_BADGE_VARIANT[detail.status]}>
              {detail.status}
            </Badge>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close result panel"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs">
        {isLoadingDetail ? (
          <span className="text-muted-foreground flex items-center gap-2">
            <Spinner /> Loading logs…
          </span>
        ) : !detail ? (
          <p className="text-destructive">Failed to load result.</p>
        ) : (
          <ul className="space-y-1">
            {detail.logs.map((logEntry) => (
              <li
                key={logEntry.id}
                className={cn(LEVEL_TEXT_STYLE[logEntry.level])}
              >
                <span className="text-muted-foreground/70">
                  {formatDateTime(logEntry.timestamp)}
                </span>{" "}
                [{logEntry.level}] {logEntry.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
