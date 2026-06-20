/** Satu titik tren eksekusi harian (7 hari terakhir). */
export interface DailyExecutionPoint {
  date: string;
  total: number;
  success: number;
}

/** Satu baris eksekusi terbaru di kartu "Recent Executions". */
export interface RecentExecution {
  id: string;
  workflowName: string;
  status: string;
  startedAt: string;
  nodeCount: number;
}

/** Agregat metrik dashboard yang dikembalikan `/metrics/dashboard`. */
export interface DashboardMetrics {
  activeWorkflows: number;
  totalWorkflows: number;
  credentials: number;
  executionsToday: number;
  executionsThisMonth: number;
  successRate: number;
  dailyTrend: DailyExecutionPoint[];
  recentExecutions: RecentExecution[];
}

/** Metrik nyata untuk satu workflow yang dikembalikan `/metrics/workflow/:id`. */
export interface WorkflowMetricsData {
  workflowId: string;
  totalExecutions: number;
  executionsThisMonth: number;
  successRate: number;
  lastExecutionStatus: string | null;
  lastExecutionAt: string | null;
  lastExecutionFinishedAt: string | null;
  updatedAt: string;
}
