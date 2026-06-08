"use client";

import { useEffect, useState } from "react";
import { Badge, Spinner } from "@/shared/ui";
import { formatDateTime, formatDuration } from "@/shared/lib/formatDate";
import { useExecutionStore } from "@/entities/execution";

const STATUS_BADGE_VARIANT = {
  success: "success",
  failed: "destructive",
  running: "warning",
} as const;

export function ExecutionHistory() {
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

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

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
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Executions</h1>
        <p className="text-sm text-muted-foreground">
          Riwayat eksekusi workflow beserta log audit.
        </p>
      </div>

      {isLoading ? (
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Memuat…
        </span>
      ) : executions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
          Belum ada eksekusi.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2">Workflow</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Mulai</th>
                <th className="px-4 py-2">Durasi</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {executions.map((execution) => (
                <tr key={execution.id} className="hover:bg-accent/40">
                  <td className="px-4 py-2 font-medium text-foreground">
                    {execution.workflowName ?? execution.workflowId}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={STATUS_BADGE_VARIANT[execution.status]}>
                      {execution.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {formatDateTime(execution.startedAt)}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {formatDuration(execution.startedAt, execution.finishedAt)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => toggleDetail(execution.id)}
                      className="text-sm text-primary hover:underline"
                    >
                      {openExecutionId === execution.id ? "Tutup" : "Detail"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {openExecutionId && (
            <div className="border-t border-border bg-muted/50 px-4 py-3">
              {isLoadingDetail || !detail ? (
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Spinner /> Memuat log…
                </span>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Node Logs
                  </p>

                  <ul className="space-y-1 font-mono text-xs">
                    {detail.nodeLogs.map((nodeLog) => (
                      <li key={nodeLog.id} className="flex items-center gap-2">
                        <Badge
                          variant={
                            nodeLog.status === "success"
                              ? "success"
                              : "destructive"
                          }
                        >
                          {nodeLog.status}
                        </Badge>
                        <span className="text-muted-foreground">
                          {nodeLog.nodeId}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
