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
  | "telegram_trigger"
  | "gmail_send"
  | "google_drive_upload"
  | "google_drive_list"
  | "ai_gemini"
  | "google_sheets_create"
  | "google_sheets_append"
  | "google_sheets_read"
  | "google_sheets_update"
  | "google_calendar_trigger"
  | "google_calendar_create_event"
  | "google_calendar_list_events"
  | "supabase_insert"
  | "supabase_query"
  | "date_calculator"
  | "schedule"
  | "wait_reply"
  | "function"
  | "transform"
  | "filter"
  | "condition"
  | "switch"
  | "merge"
  | "loop"
  | "no_op"
  | "slack_send"
  | "discord_send"
  | "rss_read"
  | "ai_openai";

/** WhatsApp delivery provider, chosen per-node via the provider dropdown. */
export type WhatsAppProvider = "meta" | "baileys";

/**
 * Family connector. Beberapa node sejenis (mis. semua operasi Google Sheets)
 * dikelompokkan jadi satu kartu di palette, lalu dipilih operasinya lewat
 * dropdown. Node tanpa family tampil sebagai kartu tunggal.
 */
export type NodeFamily =
  | "whatsapp"
  | "telegram"
  | "google_sheets"
  | "google_calendar"
  | "google_drive"
  | "database";

/** Tampilan kartu palette untuk tiap family (label + ikon perwakilan). */
export const NODE_FAMILIES: Record<
  NodeFamily,
  { label: string; icon: string }
> = {
  whatsapp: { label: "WhatsApp", icon: "MessageCircle" },
  telegram: { label: "Telegram", icon: "Send" },
  google_sheets: { label: "Google Sheets", icon: "Sheet" },
  google_calendar: { label: "Google Calendar", icon: "CalendarClock" },
  google_drive: { label: "Google Drive", icon: "FolderOpen" },
  database: { label: "Database", icon: "Database" },
};

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
  /** Family pengelompokan di palette (opsional). */
  family?: NodeFamily;
  /** Label operasi yang tampil di dropdown Operation. */
  operationLabel?: string;
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
    family: "google_sheets",
    operationLabel: "Trigger Baris",
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
      "Kirim pesan WhatsApp via Baileys (self-hosted) atau Meta Business API.",
    icon: "MessageCircle",
    family: "whatsapp",
    operationLabel: "Kirim Pesan",
    outputs: ["sent", "pending", "rows"],
  },
  {
    kind: "whatsapp_trigger",
    category: "trigger",
    label: "WhatsApp Reply",
    description: "Trigger saat ada balasan WhatsApp masuk (via Baileys).",
    icon: "MessageSquareReply",
    family: "whatsapp",
    operationLabel: "Balasan Masuk",
    outputs: ["sender", "message", "name"],
  },
  {
    kind: "telegram_send",
    category: "action",
    label: "Send Telegram",
    description: "Kirim pesan via Telegram Bot atau nomor pribadi.",
    icon: "Send",
    credentialType: "telegram",
    family: "telegram",
    operationLabel: "Kirim Pesan",
    outputs: ["sent", "results"],
  },
  {
    kind: "telegram_trigger",
    category: "trigger",
    label: "Telegram Reply",
    description: "Trigger saat ada pesan/balasan Telegram masuk.",
    icon: "MessageSquareReply",
    credentialType: "telegram",
    family: "telegram",
    operationLabel: "Pesan Masuk",
    outputs: ["sender", "message", "name"],
  },
  {
    kind: "google_sheets_create",
    category: "action",
    label: "Google Sheets Create",
    description:
      "Buat spreadsheet baru (dapat spreadsheetId) atau tambah sheet baru di spreadsheet yang ada.",
    icon: "SheetIcon",
    credentialType: "google_oauth",
    family: "google_sheets",
    operationLabel: "Buat Spreadsheet/Sheet",
    outputs: ["spreadsheetId", "spreadsheetUrl", "sheetName"],
  },
  {
    kind: "google_sheets_append",
    category: "action",
    label: "Google Sheets Append",
    description: "Append a row to Google Sheets.",
    icon: "Sheet",
    credentialType: "google_oauth",
    family: "google_sheets",
    operationLabel: "Tambah Baris",
    outputs: ["appended", "rows"],
  },
  {
    kind: "google_sheets_read",
    category: "action",
    label: "Google Sheets Read",
    description: "Read rows from a Google Sheets spreadsheet.",
    icon: "TableProperties",
    credentialType: "google_oauth",
    family: "google_sheets",
    operationLabel: "Baca Baris",
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
    family: "google_sheets",
    operationLabel: "Update Baris",
    outputs: ["updated", "rows"],
  },
  {
    kind: "google_calendar_trigger",
    category: "trigger",
    label: "Google Calendar Trigger",
    description:
      "Triggers when a calendar event is created, updated, or deleted.",
    icon: "CalendarClock",
    credentialType: "google_oauth",
    family: "google_calendar",
    operationLabel: "Trigger Event",
    outputs: ["event", "at"],
  },
  {
    kind: "google_calendar_create_event",
    category: "action",
    label: "Create Calendar Event",
    description: "Create a new event in Google Calendar.",
    icon: "CalendarPlus",
    credentialType: "google_oauth",
    family: "google_calendar",
    operationLabel: "Buat Event",
    outputs: ["eventId", "htmlLink"],
  },
  {
    kind: "google_calendar_list_events",
    category: "action",
    label: "List Calendar Events",
    description: "Fetch a list of upcoming events from Google Calendar.",
    icon: "CalendarDays",
    credentialType: "google_oauth",
    family: "google_calendar",
    operationLabel: "List Event",
    outputs: ["events", "count"],
  },
  {
    kind: "gmail_send",
    category: "action",
    label: "Send Gmail",
    description: "Kirim email lewat akun Gmail yang terhubung.",
    icon: "Mail",
    credentialType: "google_oauth",
    outputs: ["messageId", "threadId"],
  },
  {
    kind: "google_drive_upload",
    category: "action",
    label: "Google Drive Upload",
    description: "Unggah file teks ke Google Drive.",
    icon: "Upload",
    credentialType: "google_oauth",
    family: "google_drive",
    operationLabel: "Upload File",
    outputs: ["fileId", "webViewLink"],
  },
  {
    kind: "google_drive_list",
    category: "action",
    label: "Google Drive List",
    description: "Daftar file di Google Drive (opsional dalam satu folder).",
    icon: "FolderOpen",
    credentialType: "google_oauth",
    family: "google_drive",
    operationLabel: "List File",
    outputs: ["files", "count"],
  },
  {
    kind: "ai_gemini",
    category: "action",
    label: "AI Gemini",
    description: "Hasilkan teks dengan Google Gemini dari prompt.",
    icon: "Sparkles",
    credentialType: "gemini",
    outputs: ["text", "raw"],
  },
  {
    kind: "supabase_insert",
    category: "action",
    label: "Database Insert",
    description: "Simpan satu/banyak baris ke database proyek.",
    icon: "DatabaseZap",
    family: "database",
    operationLabel: "Insert Baris",
    outputs: ["inserted", "rows"],
  },
  {
    kind: "supabase_query",
    category: "action",
    label: "Database Query",
    description: "Baca baris dari database proyek dengan filter opsional.",
    icon: "Database",
    family: "database",
    operationLabel: "Query Baris",
    outputs: ["rows", "count"],
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
  {
    kind: "switch",
    category: "logic",
    label: "Switch",
    description:
      "Percabangan multi-arah: arahkan data ke output berbeda berdasarkan nilai sebuah field.",
    icon: "Split",
    outputs: ["matched", "value"],
  },
  {
    kind: "merge",
    category: "logic",
    label: "Merge",
    description:
      "Gabungkan baris dari beberapa cabang menjadi satu aliran data tunggal.",
    icon: "Merge",
    outputs: ["rows", "totalRows"],
  },
  {
    kind: "loop",
    category: "logic",
    label: "Loop (Split In Batches)",
    description:
      "Pecah array menjadi batch berukuran tertentu agar diproses bertahap tanpa overload.",
    icon: "Repeat",
    outputs: ["batch", "batchIndex", "totalBatches"],
  },
  {
    kind: "no_op",
    category: "logic",
    label: "No Operation",
    description:
      "Tidak melakukan apa pun; berguna sebagai penanda akhir cabang atau placeholder.",
    icon: "CircleDashed",
    outputs: ["rows"],
  },
  {
    kind: "slack_send",
    category: "action",
    label: "Send Slack",
    description: "Kirim pesan ke channel Slack lewat Incoming Webhook URL.",
    icon: "Slack",
    outputs: ["sent"],
  },
  {
    kind: "discord_send",
    category: "action",
    label: "Send Discord",
    description: "Kirim pesan ke channel Discord lewat Webhook URL.",
    icon: "MessageSquare",
    outputs: ["sent"],
  },
  {
    kind: "rss_read",
    category: "action",
    label: "RSS Read",
    description: "Ambil dan parse item terbaru dari sebuah RSS/Atom feed.",
    icon: "Rss",
    outputs: ["items", "count"],
  },
  {
    kind: "ai_openai",
    category: "action",
    label: "AI OpenAI",
    description:
      "Hasilkan teks dengan OpenAI / OpenRouter dari prompt (alternatif Gemini).",
    icon: "Sparkles",
    credentialType: "openai",
    outputs: ["text", "raw"],
  },
];

export function getNodeTypeDef(nodeKind: NodeKind): NodeTypeDef | undefined {
  return NODE_TYPES.find((nodeType) => nodeType.kind === nodeKind);
}

/** Nama brand yang punya berkas SVG resmi di `public/icons`. */
export type NodeBrandIcon =
  | "whatsapp"
  | "telegram"
  | "gmail"
  | "google-sheets"
  | "google-calendar"
  | "gemini"
  | "google-drive";

/** Pemetaan family ke ikon brand resmi (mayoritas node bermerek lewat family). */
const BRAND_ICON_BY_FAMILY: Partial<Record<NodeFamily, NodeBrandIcon>> = {
  whatsapp: "whatsapp",
  telegram: "telegram",
  google_sheets: "google-sheets",
  google_calendar: "google-calendar",
  google_drive: "google-drive",
};

/** Pemetaan kind spesifik yang tidak memiliki family namun tetap bermerek. */
const BRAND_ICON_BY_KIND: Partial<Record<NodeKind, NodeBrandIcon>> = {
  gmail_send: "gmail",
  ai_gemini: "gemini",
};

/**
 * Mengembalikan ikon brand resmi untuk sebuah kind bila tersedia (mis. WhatsApp,
 * Gmail, Google Sheets). Mengembalikan null untuk node generik yang memakai
 * ikon lucide biasa.
 */
export function getNodeBrandIcon(nodeKind: NodeKind): NodeBrandIcon | null {
  const byKind = BRAND_ICON_BY_KIND[nodeKind];

  if (byKind) {
    return byKind;
  }

  const definition = getNodeTypeDef(nodeKind);

  if (definition?.family && BRAND_ICON_BY_FAMILY[definition.family]) {
    return BRAND_ICON_BY_FAMILY[definition.family] ?? null;
  }

  return null;
}

/**
 * Mengembalikan semua operasi (kind) milik satu family pada kategori tertentu.
 * Dipakai dropdown Operation untuk berpindah antar operasi sejenis.
 */
export function getFamilyOperations(
  family: NodeFamily,
  category: NodeCategory,
): NodeTypeDef[] {
  return NODE_TYPES.filter(
    (nodeType) => nodeType.family === family && nodeType.category === category,
  );
}

/**
 * Mengembalikan operasi sejenis (family + kategori sama) untuk sebuah kind,
 * agar panel konfigurasi bisa menampilkan dropdown pemilih operasi.
 */
export function getSiblingOperations(nodeKind: NodeKind): NodeTypeDef[] {
  const definition = getNodeTypeDef(nodeKind);

  if (!definition?.family) {
    return [];
  }

  return getFamilyOperations(definition.family, definition.category);
}
