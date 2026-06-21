export type ExecutionStatus = "running" | "success" | "failed";
export type LogLevel = "info" | "warn" | "error";

export interface NodeLog {
  id: string;
  nodeId: string;
  /** Nama node yang ramah dibaca, di-resolve dari definisi workflow. */
  nodeLabel?: string;
  status: "success" | "failed" | "skipped";
  output: unknown;
  /** Pesan error spesifik bila node gagal. */
  errorMessage?: string | null;
  timestamp: string;
}

export interface LogEntry {
  id: string;
  message: string;
  level: LogLevel;
  timestamp: string;
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName?: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt: string | null;
  result: unknown;
}

export interface ExecutionDetail extends Execution {
  nodeLogs: NodeLog[];
  logs: LogEntry[];
}
