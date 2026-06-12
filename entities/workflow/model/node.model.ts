/** Node category, mirroring the n8n Trigger/Action split (docs/n8n.md). */
export type NodeCategory = "trigger" | "action" | "logic";

/** Concrete node kinds supported by the MVP execution engine. */
export type NodeKind =
  | "manual_trigger"
  | "webhook_trigger"
  | "schedule_trigger"
  | "google_sheets_trigger"
  | "http_request"
  | "whatsapp_send"
  | "whatsapp_trigger"
  | "telegram_send"
  | "google_sheets_append"
  | "google_sheets_read"
  | "google_sheets_update"
  | "google_calendar_trigger"
  | "google_calendar_create_event"
  | "google_calendar_list_events"
  | "date_calculator"
  | "schedule"
  | "wait_reply"
  | "function"
  | "transform"
  | "filter"
  | "condition";

/** WhatsApp delivery provider, chosen per-node via the provider dropdown. */
export type WhatsAppProvider = "whapi" | "fonnte" | "meta";

export interface NodeTypeDef {
  kind: NodeKind;
  category: NodeCategory;
  label: string;
  description: string;
  /** lucide-react icon name used in the palette and on the node. */
  icon: string;
  /** Connector credential type required, if any. */
  credentialType?: string;
  /** Named output keys this node produces (shown in the Output section of the node card). */
  outputs?: string[];
}

/** Data carried on each React Flow node (stored in Workflow.nodes JSON). */
export interface WorkflowNodeData {
  kind: NodeKind;
  label: string;
  /** Arbitrary per-node configuration (URL, message, code, etc.). */
  config: Record<string, unknown>;
  /** Selected credential id for connector nodes. */
  credentialId?: string;
}

/** Palette of available node types shown in the editor. */
export const NODE_TYPES: NodeTypeDef[] = [
  {
    kind: "manual_trigger",
    category: "trigger",
    label: "Start",
    description: "Entry point for this automation.",
    icon: "Play",
    outputs: ["triggered", "at"],
  },
  {
    kind: "webhook_trigger",
    category: "trigger",
    label: "Webhook",
    description: "Handles incoming HTTP POST requests.",
    icon: "Webhook",
    outputs: ["body", "headers", "method"],
  },
  {
    kind: "schedule_trigger",
    category: "trigger",
    label: "Schedule (Cron)",
    description: "Run the workflow on a cron schedule.",
    icon: "Clock",
    outputs: ["triggered", "at"],
  },
  {
    kind: "google_sheets_trigger",
    category: "trigger",
    label: "Google Sheets Trigger",
    description:
      "Trigger when a new row is added or a row is updated in Google Sheets.",
    icon: "TableProperties",
    credentialType: "google_oauth",
    outputs: ["triggered", "at"],
  },
  {
    kind: "http_request",
    category: "action",
    label: "HTTP Request",
    description: "Call any HTTP/REST endpoint.",
    icon: "Globe",
    credentialType: "http",
    outputs: ["status", "body"],
  },
  {
    kind: "whatsapp_send",
    category: "action",
    label: "Send WhatsApp",
    description:
      "Kirim pesan WhatsApp. Pilih provider: Whapi, Fonnte, atau Meta.",
    icon: "MessageCircle",
    outputs: ["sent", "pending", "rows"],
  },
  {
    kind: "whatsapp_trigger",
    category: "trigger",
    label: "WhatsApp Reply",
    description:
      "Trigger saat ada balasan WhatsApp masuk (via webhook Whapi/Fonnte).",
    icon: "MessageSquareReply",
    outputs: ["sender", "message", "name"],
  },
  {
    kind: "telegram_send",
    category: "action",
    label: "Send Telegram",
    description: "Send a message via Telegram Bot.",
    icon: "Send",
    credentialType: "telegram",
    outputs: ["sent", "results"],
  },
  {
    kind: "google_sheets_append",
    category: "action",
    label: "Google Sheets Append",
    description: "Append a row to Google Sheets.",
    icon: "Sheet",
    credentialType: "google_oauth",
    outputs: ["appended", "rows"],
  },
  {
    kind: "google_sheets_read",
    category: "action",
    label: "Google Sheets Read",
    description: "Read rows from a Google Sheets spreadsheet.",
    icon: "TableProperties",
    credentialType: "google_oauth",
    outputs: ["rows", "headers", "totalRows"],
  },
  {
    kind: "google_sheets_update",
    category: "action",
    label: "Google Sheets Update",
    description:
      "Update a cell/column on matching rows — e.g. mark reminder as sent.",
    icon: "SheetIcon",
    credentialType: "google_oauth",
    outputs: ["updated", "rows"],
  },
  {
    kind: "google_calendar_trigger",
    category: "trigger",
    label: "Google Calendar Trigger",
    description:
      "Triggers when a calendar event is created, updated, or deleted.",
    icon: "CalendarClock",
    credentialType: "google_calendar",
    outputs: ["event", "at"],
  },
  {
    kind: "google_calendar_create_event",
    category: "action",
    label: "Create Calendar Event",
    description: "Create a new event in Google Calendar.",
    icon: "CalendarPlus",
    credentialType: "google_calendar",
    outputs: ["eventId", "htmlLink"],
  },
  {
    kind: "google_calendar_list_events",
    category: "action",
    label: "List Calendar Events",
    description: "Fetch a list of upcoming events from Google Calendar.",
    icon: "CalendarDays",
    credentialType: "google_calendar",
    outputs: ["events", "count"],
  },
  {
    kind: "date_calculator",
    category: "logic",
    label: "Date Calculator",
    description:
      "Hitung tanggal relatif (mis. Deadline dikurangi 3 hari) untuk penjadwalan.",
    icon: "Calculator",
    outputs: ["computedDate", "rows"],
  },
  {
    kind: "schedule",
    category: "logic",
    label: "Schedule (Tunggu Tanggal)",
    description:
      "Tunda alur sampai tanggal/jam tertentu sebelum melanjutkan ke node berikutnya.",
    icon: "Timer",
    outputs: ["scheduledAt", "rows"],
  },
  {
    kind: "wait_reply",
    category: "logic",
    label: "Wait Reply",
    description:
      "Pause eksekusi sampai target membalas WhatsApp, lalu lanjutkan alur.",
    icon: "Hourglass",
    outputs: ["reply", "sender", "message"],
  },
  {
    kind: "function",
    category: "logic",
    label: "Function (Code)",
    description: "Run a custom JavaScript snippet to transform data.",
    icon: "Code",
    outputs: ["result"],
  },
  {
    kind: "transform",
    category: "logic",
    label: "Transform",
    description:
      "Petakan ulang data: mode key/value dengan {{ekspresi}} atau JavaScript.",
    icon: "Shuffle",
    outputs: ["result", "rows"],
  },
  {
    kind: "condition",
    category: "logic",
    label: "If / Else",
    description: "Branch the flow based on a condition.",
    icon: "GitBranch",
    outputs: ["true", "false"],
  },
  {
    kind: "filter",
    category: "logic",
    label: "Filter Rows",
    description:
      "Keep only the rows that match your conditions (e.g. Pembayaran = Belum Dibayar).",
    icon: "Filter",
    outputs: ["rows", "filtered"],
  },
];

export function getNodeTypeDef(nodeKind: NodeKind): NodeTypeDef | undefined {
  return NODE_TYPES.find((nodeType) => nodeType.kind === nodeKind);
}
