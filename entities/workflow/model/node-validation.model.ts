import type { NodeKind, WorkflowNodeData } from "./node.model";

/**
 * Lightweight per-kind config validation for the workflow editor. Surfaces
 * missing required fields and obvious type problems before a node runs, in the
 * spirit of n8n's schema validation — without a heavy JSON-schema dependency.
 */

export interface NodeValidationIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

/** A single required-field rule for a node kind. */
interface FieldRule {
  key: string;
  label: string;
  /** Validates the value; return an issue message or null when valid. */
  validate?: (value: unknown) => string | null;
}

const REQUIRED_FIELDS: Partial<Record<NodeKind, FieldRule[]>> = {
  http_request: [
    { key: "url", label: "URL" },
    { key: "method", label: "Method" },
  ],
  whatsapp_send: [{ key: "message", label: "Pesan" }],
  google_sheets_read: [{ key: "spreadsheetId", label: "Spreadsheet ID" }],
  google_sheets_update: [{ key: "spreadsheetId", label: "Spreadsheet ID" }],
  google_sheets_append: [{ key: "spreadsheetId", label: "Spreadsheet ID" }],
  schedule_trigger: [{ key: "cron", label: "Cron Expression" }],
  telegram_send: [
    { key: "chatId", label: "Chat ID" },
    { key: "text", label: "Pesan" },
  ],
};

/** Node kinds that require a credential to be selected. */
const CREDENTIAL_REQUIRED: Partial<Record<NodeKind, boolean>> = {
  http_request: false,
  whatsapp_send: true,
  google_sheets_read: true,
  google_sheets_update: true,
  google_sheets_append: true,
  google_calendar_create_event: true,
  google_calendar_list_events: true,
  telegram_send: true,
};

/**
 * Validates a node's data and returns any issues found. An empty array means
 * the node is considered valid.
 */
export function validateNodeData(
  nodeData: WorkflowNodeData,
): NodeValidationIssue[] {
  const issues: NodeValidationIssue[] = [];
  const config = nodeData.config ?? {};

  const fieldRules = REQUIRED_FIELDS[nodeData.kind] ?? [];

  for (const rule of fieldRules) {
    const value = config[rule.key];
    const isEmpty =
      value === undefined || value === null || String(value).trim() === "";

    if (isEmpty) {
      issues.push({
        field: rule.key,
        message: `${rule.label} wajib diisi.`,
        severity: "error",
      });
      continue;
    }

    const customMessage = rule.validate?.(value);

    if (customMessage) {
      issues.push({
        field: rule.key,
        message: customMessage,
        severity: "error",
      });
    }
  }

  /** Condition node in code mode needs a non-empty expression. */
  if (nodeData.kind === "condition" && config.mode === "code") {
    const expression = String(config.expression ?? "").trim();

    if (!expression) {
      issues.push({
        field: "expression",
        message: "Ekspresi kode tidak boleh kosong.",
        severity: "error",
      });
    }
  }

  if (CREDENTIAL_REQUIRED[nodeData.kind] && !nodeData.credentialId) {
    issues.push({
      field: "credentialId",
      message: "Kredensial belum dipilih.",
      severity: "warning",
    });
  }

  return issues;
}
