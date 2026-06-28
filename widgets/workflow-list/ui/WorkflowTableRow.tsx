"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import {
  ClockIcon,
  GlobeIcon,
  SheetIcon,
  CheckCircle2Icon,
  XCircleIcon,
  MoreVerticalIcon,
  Trash2Icon,
  DownloadIcon,
} from "lucide-react";
import { Badge, Sparkline, toast, ConfirmDialog } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";
import { cn } from "@/shared/lib/utils";
import { staggerItem } from "@/shared/lib/motion-presets";
import { workflowService, type WorkflowSummary } from "@/entities/workflow";
import { deriveWorkflowMetrics } from "../lib/workflowMetrics";
import { exportWorkflow } from "../lib/workflowTransfer";

interface WorkflowTableRowProps {
  workflow: WorkflowSummary;
  onRemove: (workflowId: string) => void;
}

const TRIGGER_ICONS: Record<string, typeof ClockIcon> = {
  Cron: ClockIcon,
  Webhook: GlobeIcon,
  "Google Sheets": SheetIcon,
};

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "success" | "neutral" }
> = {
  active: { label: "Active", variant: "success" },
  draft: { label: "Draft", variant: "neutral" },
};

/** Satu baris tabel workflow dengan metrik (gambar 2). */
export function WorkflowTableRow({
  workflow,
  onRemove,
}: WorkflowTableRowProps) {
  const metrics = deriveWorkflowMetrics(workflow);
  const TriggerIcon = TRIGGER_ICONS[metrics.triggerType] ?? ClockIcon;
  const statusBadge = STATUS_BADGE[metrics.status];
  const isActive = metrics.status === "active";

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleConfirmRemove = () => {
    setIsConfirmOpen(false);
    onRemove(workflow.id);
  };

  /**
   * Ekspor mengambil definisi lengkap (nodes/edges) lebih dulu karena ringkasan
   * baris tidak memuatnya, lalu mengunduhnya sebagai berkas JSON.
   */
  const handleExport = async () => {
    try {
      const detail = await workflowService.getById(workflow.id);

      exportWorkflow({
        name: detail.name,
        nodes: detail.nodes,
        edges: detail.edges,
      });
    } catch {
      toast.error("Failed to export workflow");
    }
  };

  return (
    <motion.tr
      variants={staggerItem}
      className="border-border hover:bg-accent/40 border-b last:border-0"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange-100 text-orange-600">
            <TriggerIcon className="size-4" />
          </span>
          <div className="flex min-w-0 flex-col">
            <Link
              href={ROUTES.workflow(workflow.id)}
              className="text-foreground hover:text-primary truncate text-sm font-semibold"
            >
              {workflow.name}
            </Link>
            <span className="text-muted-foreground mt-0.5 text-xs">
              v{workflow.version} · {metrics.stepCount} node
            </span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <TriggerIcon className="text-muted-foreground size-3.5" />
          <div className="flex flex-col">
            <span className="text-foreground text-sm">
              {metrics.triggerType}
            </span>
            <span className="text-muted-foreground text-xs">
              {metrics.triggerDetail}
            </span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {!metrics.hasExecution ? (
            <ClockIcon className="text-muted-foreground size-4" />
          ) : metrics.lastExecutionOk ? (
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          ) : (
            <XCircleIcon className="size-4 text-red-500" />
          )}
          <div className="flex flex-col">
            <span
              className={cn(
                "text-sm font-medium",
                !metrics.hasExecution
                  ? "text-muted-foreground"
                  : metrics.lastExecutionOk
                    ? "text-emerald-600"
                    : "text-red-600",
              )}
            >
              {metrics.lastExecutionLabel}
            </span>
            <span className="text-muted-foreground text-xs">
              {metrics.lastExecutionAt} · {metrics.stepCount} steps
            </span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          <span
            className={cn(
              "flex h-5 w-9 items-center rounded-full px-0.5 transition-colors",
              isActive ? "bg-orange-500" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "size-4 rounded-full bg-white shadow-sm transition-transform",
                isActive && "translate-x-4",
              )}
            />
          </span>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-semibold">
              {metrics.executions}
            </span>
            <span className="text-muted-foreground text-xs">This month</span>
          </div>
          <div className="h-8 w-20">
            <Sparkline data={metrics.executionTrend} height={32} />
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="text-muted-foreground text-sm">
          {metrics.updatedLabel}
        </span>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={handleExport}
            className="text-muted-foreground hover:bg-accent hover:text-foreground grid size-8 place-items-center rounded-md"
            aria-label="Export workflow"
          >
            <DownloadIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive grid size-8 place-items-center rounded-md"
            aria-label="Delete workflow"
          >
            <Trash2Icon className="size-4" />
          </button>

          <ConfirmDialog
            open={isConfirmOpen}
            onOpenChange={setIsConfirmOpen}
            title="Delete this workflow?"
            description={`The workflow "${workflow.name}" will be permanently deleted along with its execution history. This action cannot be undone.`}
            confirmLabel="Delete"
            onConfirm={handleConfirmRemove}
          />
          <Link
            href={ROUTES.workflow(workflow.id)}
            className="text-muted-foreground hover:bg-accent hover:text-foreground grid size-8 place-items-center rounded-md"
            aria-label="Open editor"
          >
            <MoreVerticalIcon className="size-4" />
          </Link>
        </div>
      </td>
    </motion.tr>
  );
}
