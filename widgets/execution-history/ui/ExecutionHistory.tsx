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
        <h1 className="text-foreground text-2xl font-bold">Executions</h1>
        <p className="text-muted-foreground text-sm">
          Riwayat eksekusi workflow beserta log audit.
        </p>
      </div>

      {isLoading ? (
        <span className="text-muted-foreground flex items-center gap-2 text-sm">
          <Spinner /> Memuat…
        </span>
      ) : executions.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed py-12 text-center">
          Belum ada eksekusi.
        </div>
      ) : (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-2">Workflow</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Mulai</th>
                <th className="px-4 py-2">Durasi</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>

            <tbody className="divide-border divide-y">
              {executions.map((execution) => (
                <tr key={execution.id} className="hover:bg-accent/40">
                  <td className="text-foreground px-4 py-2 font-medium">
                    {execution.workflowName ?? execution.workflowId}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={STATUS_BADGE_VARIANT[execution.status]}>
                      {execution.status}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground px-4 py-2">
                    {formatDateTime(execution.startedAt)}
                  </td>
                  <td className="text-muted-foreground px-4 py-2">
                    {formatDuration(execution.startedAt, execution.finishedAt)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => toggleDetail(execution.id)}
                      className="text-primary text-sm hover:underline"
                    >
                      {openExecutionId === execution.id ? "Tutup" : "Detail"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {openExecutionId && (
            <div className="border-border bg-muted/50 border-t px-4 py-3">
              {isLoadingDetail || !detail ? (
                <span className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Spinner /> Memuat log…
                </span>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground text-xs font-semibold">
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
