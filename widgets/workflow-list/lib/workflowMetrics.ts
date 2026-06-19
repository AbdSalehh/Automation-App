import type { WorkflowSummary } from "@/entities/workflow";

/** Status tampilan workflow di tabel. Diturunkan dari `isPublished` + dummy. */
export type WorkflowDisplayStatus = "active" | "paused" | "draft";

export interface WorkflowMetrics {
  status: WorkflowDisplayStatus;
  triggerType: string;
  triggerDetail: string;
  lastExecutionOk: boolean;
  lastExecutionLabel: string;
  lastExecutionAt: string;
  durationLabel: string;
  stepCount: number;
  executions: number;
  executionTrend: number[];
  tags: string[];
  updatedLabel: string;
}

const TRIGGERS = [
  { type: "Cron", detail: "Every 1 hour" },
  { type: "Cron", detail: "Every 6 hours" },
  { type: "Webhook", detail: "/api/webhook/lead" },
  { type: "Cron", detail: "Every day 08:00" },
  { type: "Google Sheets", detail: "New row added" },
  { type: "Webhook", detail: "/api/webhook/log" },
];

const TAG_POOL = [
  ["Finance", "Reminder"],
  ["Marketing", "Followup"],
  ["Sales", "Leads"],
  ["Report"],
  ["Marketing", "Campaign"],
  ["System"],
];

const TIME_LABELS = [
  "2m ago",
  "15m ago",
  "5m ago",
  "1h ago",
  "2h ago",
  "30m ago",
];

const UPDATED_LABELS = [
  "2 minutes ago",
  "1 hour ago",
  "3 hours ago",
  "5 hours ago",
  "1 day ago",
  "2 days ago",
];

const DURATIONS = ["1.2s", "780ms", "320ms", "2.4s", "1.6s", "210ms"];

/** Hash sederhana & deterministik dari id agar metrik dummy stabil per workflow. */
function hashId(workflowId: string): number {
  let hash = 0;

  for (let index = 0; index < workflowId.length; index += 1) {
    hash = (hash * 31 + workflowId.charCodeAt(index)) % 100000;
  }

  return hash;
}

/** Bangun deret tren naik-turun semu yang stabil dari sebuah seed. */
function buildTrend(seed: number): number[] {
  return Array.from({ length: 8 }, (_unused, index) => {
    const wave = Math.sin(seed + index) * 20 + 50;

    return Math.round(Math.abs(wave) + (index % 3) * 6);
  });
}

/**
 * Menurunkan metrik tampilan untuk satu workflow. Nilai yang belum tersedia di
 * backend (eksekusi, durasi, trigger, tag) memakai data dummy deterministik
 * berbasis id sehingga konsisten antar render.
 */
export function deriveWorkflowMetrics(
  workflow: WorkflowSummary,
): WorkflowMetrics {
  const seed = hashId(workflow.id);
  const bucket = seed % 6;

  const status: WorkflowDisplayStatus = workflow.isPublished
    ? seed % 4 === 0
      ? "paused"
      : "active"
    : "draft";

  const lastExecutionOk = seed % 5 !== 0;

  return {
    status,
    triggerType: TRIGGERS[bucket].type,
    triggerDetail: TRIGGERS[bucket].detail,
    lastExecutionOk,
    lastExecutionLabel: lastExecutionOk ? "Success" : "Error",
    lastExecutionAt: TIME_LABELS[bucket],
    durationLabel: DURATIONS[bucket],
    stepCount: workflow.nodeCount,
    executions: 28 + (seed % 520),
    executionTrend: buildTrend(seed),
    tags: TAG_POOL[bucket],
    updatedLabel: UPDATED_LABELS[bucket],
  };
}

/** Ringkasan agregat untuk kartu statistik di atas tabel. */
export function summarizeWorkflows(workflows: WorkflowSummary[]) {
  const statuses = workflows.map(
    (workflow) => deriveWorkflowMetrics(workflow).status,
  );

  return {
    total: workflows.length,
    active: statuses.filter((status) => status === "active").length,
    paused: statuses.filter((status) => status === "paused").length,
    draft: statuses.filter((status) => status === "draft").length,
  };
}
