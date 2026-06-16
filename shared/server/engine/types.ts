import type { FlowNode } from "@/entities/workflow/model/workflow.model";

/**
 * In-process, item-aware workflow execution engine — shared types.
 *
 * Data flows between nodes as an array of "items" (rows). Source nodes such as
 * Google Sheets Read emit one item per row; action nodes such as WhatsApp Send
 * run once per item, resolving `{{column}}` templates against that row. This
 * mirrors n8n's per-item execution model.
 *
 * Server-only module.
 */

export interface RunContext {
  executionId: string;
  ownerId: string;
  /** The workflow being executed — used to scope per-row reminders. */
  workflowId: string;
  /** Optional payload that seeds trigger nodes (webhook body, etc.). */
  triggerPayload?: unknown;
}

/** Normalised flowing value: always an array of row objects. */
export type Item = Record<string, unknown>;

/**
 * Scope eksekusi: `"main"` untuk run manual/terjadwal/trigger non-balasan,
 * `"reply"` untuk run yang dipicu balasan WhatsApp/Telegram masuk (webhook).
 */
export type TriggerScope = "main" | "reply";

export interface ExecOutcome {
  status: "success" | "failed" | "paused";
  lastOutput: unknown;
}

/** Argumen yang diterima setiap handler node. */
export interface NodeRunArgs {
  node: FlowNode;
  input: unknown;
  context: RunContext;
  config: Record<string, unknown>;
}

/** Kontrak eksekusi satu node. */
export type NodeHandler = (args: NodeRunArgs) => Promise<unknown>;
