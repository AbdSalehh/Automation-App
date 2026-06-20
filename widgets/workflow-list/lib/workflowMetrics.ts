import type { WorkflowSummary } from "@/entities/workflow";

/** Status tampilan workflow di tabel. Diturunkan dari `isPublished`. */
export type WorkflowDisplayStatus = "active" | "draft";

export interface WorkflowMetrics {
  status: WorkflowDisplayStatus;
  triggerType: string;
  triggerDetail: string;
  hasExecution: boolean;
  lastExecutionOk: boolean;
  lastExecutionLabel: string;
  lastExecutionAt: string;
  stepCount: number;
  executions: number;
  executionTrend: number[];
  updatedLabel: string;
}

/**
 * Pemetaan `kind` node trigger ke label & detail yang ramah dibaca pada tabel.
 */
const TRIGGER_LABELS: Record<string, { type: string; detail: string }> = {
  schedule_trigger: { type: "Cron", detail: "Berbasis jadwal" },
  webhook_trigger: { type: "Webhook", detail: "Pemicu HTTP" },
  whatsapp_trigger: { type: "WhatsApp", detail: "Pesan masuk" },
  telegram_trigger: { type: "Telegram", detail: "Pesan masuk" },
  google_sheets_trigger: { type: "Google Sheets", detail: "Baris baru" },
};

/**
 * Mengubah ISO timestamp menjadi label relatif singkat (mis. "5 menit lalu").
 * Mengembalikan "-" bila nilai kosong.
 */
function toRelativeLabel(isoTimestamp: string | null): string {
  if (!isoTimestamp) {
    return "-";
  }

  const elapsedMs = Date.now() - new Date(isoTimestamp).getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  if (elapsedMinutes < 1) {
    return "Baru saja";
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} menit lalu`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `${elapsedHours} jam lalu`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);

  return `${elapsedDays} hari lalu`;
}

/**
 * Membentuk deret sparkline ringan dari jumlah eksekusi. Murni dekoratif untuk
 * memberi konteks tren; besarannya proporsional dengan total eksekusi nyata.
 */
function buildTrendFromCount(executionCount: number): number[] {
  if (executionCount === 0) {
    return [0, 0, 0, 0, 0, 0, 0];
  }

  const base = Math.max(1, Math.round(executionCount / 7));

  return Array.from({ length: 7 }, (_unused, index) => {
    const wave = Math.sin(index * 1.1) * 0.4 + 1;

    return Math.max(1, Math.round(base * wave));
  });
}

/**
 * Menurunkan metrik tampilan untuk satu workflow sepenuhnya dari data nyata
 * pada ringkasan: status publikasi, trigger, jumlah & status eksekusi terakhir,
 * serta waktu pembaruan.
 */
export function deriveWorkflowMetrics(
  workflow: WorkflowSummary,
): WorkflowMetrics {
  const status: WorkflowDisplayStatus = workflow.isPublished
    ? "active"
    : "draft";

  const triggerLabel = workflow.triggerKind
    ? TRIGGER_LABELS[workflow.triggerKind]
    : undefined;

  const hasExecution = workflow.lastExecutionStatus !== null;
  const lastExecutionOk = workflow.lastExecutionStatus === "success";

  return {
    status,
    triggerType: triggerLabel?.type ?? "Manual",
    triggerDetail: triggerLabel?.detail ?? "Tanpa trigger",
    hasExecution,
    lastExecutionOk,
    lastExecutionLabel: !hasExecution
      ? "Belum jalan"
      : lastExecutionOk
        ? "Success"
        : workflow.lastExecutionStatus === "running"
          ? "Running"
          : "Error",
    lastExecutionAt: toRelativeLabel(workflow.lastExecutionAt),
    stepCount: workflow.nodeCount,
    executions: workflow.executionCount,
    executionTrend: buildTrendFromCount(workflow.executionCount),
    updatedLabel: toRelativeLabel(workflow.updatedAt),
  };
}

/** Ringkasan agregat untuk kartu statistik di atas tabel. */
export function summarizeWorkflows(workflows: WorkflowSummary[]) {
  const activeCount = workflows.filter(
    (workflow) => workflow.isPublished,
  ).length;

  const totalExecutions = workflows.reduce(
    (runningTotal, workflow) => runningTotal + workflow.executionCount,
    0,
  );

  return {
    total: workflows.length,
    active: activeCount,
    draft: workflows.length - activeCount,
    totalExecutions,
  };
}
