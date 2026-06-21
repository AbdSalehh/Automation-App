"use client";

import { useEffect } from "react";
import {
  XIcon,
  Trash2Icon,
  TableIcon,
  PlayIcon,
  AlertTriangleIcon,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  MultiSelect,
  Spinner,
  ScrollArea,
} from "@/shared/ui";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  useWorkflowStore,
  useSheetColumnsStore,
  useSheetPreviewStore,
  useNodeTestStore,
  getNodeTypeDef,
  getSiblingOperations,
  validateNodeData,
  type FlowNode,
  type ConditionGroup,
  type NodeKind,
} from "@/entities/workflow";
import { useCredentialStore } from "@/entities/credential";
import { ConditionBuilder } from "./ConditionBuilder";
import { SheetWriteTargets, type WriteTarget } from "./SheetWriteTargets";
import { SpreadsheetPreviewDrawer } from "./SpreadsheetPreviewDrawer";
import { DateCalculatorConfig } from "./DateCalculatorConfig";
import { ScheduleTriggerConfig } from "./ScheduleTriggerConfig";
import { TransformConfig, type TransformMapping } from "./TransformConfig";
import { ExpressionInput } from "./ExpressionInput";
import { DateTimePicker } from "./DateTimePicker";
import { HtmlEmailDialog } from "./HtmlEmailDialog";
import { AiAgentCredentials } from "./AiAgentCredentials";
import type { VariableGroup } from "./VariablePicker";
import { GEMINI_MODELS } from "@/shared/config/constants";
import { cn } from "@/shared/lib/utils";

interface NodeConfigPanelProps {
  node: FlowNode;
  onClose: () => void;
}

interface ConfigFieldDef {
  key: string;
  label: string;
  multiline?: boolean;
  placeholder?: string;
  /** Render as a dropdown of live spreadsheet columns. */
  columnSelect?: boolean;
  /** Render as a dropdown with a fixed set of options. */
  selectOptions?: { value: string; label: string }[];
  /** Render as a Calendar + time picker writing a local ISO string. */
  dateTime?: boolean;
  /** Render the HTML email dialog when the node's bodyType is "html". */
  htmlEmail?: boolean;
  hint?: string;
}

/**
 * Pilihan kode negara untuk normalisasi nomor pada node Wait Reply. Indonesia
 * didahulukan; sisanya negara yang umum dipakai.
 */
const COUNTRY_CODE_OPTIONS = [
  { value: "62", label: "\uD83C\uDDEE\uD83C\uDDE9 Indonesia (+62)" },
  { value: "60", label: "\uD83C\uDDF2\uD83C\uDDFE Malaysia (+60)" },
  { value: "65", label: "\uD83C\uDDF8\uD83C\uDDEC Singapura (+65)" },
  { value: "63", label: "\uD83C\uDDF5\uD83C\uDDED Filipina (+63)" },
  { value: "66", label: "\uD83C\uDDF9\uD83C\uDDED Thailand (+66)" },
  { value: "84", label: "\uD83C\uDDFB\uD83C\uDDF3 Vietnam (+84)" },
  { value: "91", label: "\uD83C\uDDEE\uD83C\uDDF3 India (+91)" },
  { value: "1", label: "\uD83C\uDDFA\uD83C\uDDF8 US / Canada (+1)" },
  { value: "44", label: "\uD83C\uDDEC\uD83C\uDDE7 UK (+44)" },
  { value: "61", label: "\uD83C\uDDE6\uD83C\uDDFA Australia (+61)" },
];

const CONFIG_FIELDS: Record<string, ConfigFieldDef[]> = {
  ai_gemini: [
    {
      key: "systemInstruction",
      label: "Peran AI (System Instruction)",
      multiline: true,
      placeholder:
        "Kamu adalah asisten yang mencatat pengeluaran. Ekstrak nama item dan harga dari pesan.",
      hint: "Mendefinisikan persona/peran AI dan format balasan yang diharapkan.",
    },
    {
      key: "prompt",
      label: "Prompt / Pesan",
      multiline: true,
      placeholder: "{{message}}",
      hint: "Pesan yang diproses AI. Gunakan {{message}} untuk isi pesan masuk.",
    },
    {
      key: "model",
      label: "Model (opsional)",
      selectOptions: GEMINI_MODELS,
      hint: "Flash-Lite cocok saat Flash sedang sibuk (high-traffic).",
    },
  ],
  supabase_insert: [
    { key: "table", label: "Nama Tabel", placeholder: "expenses" },
    {
      key: "columns",
      label: "Kolom (satu per baris: kolom=nilai)",
      multiline: true,
      placeholder: "item={{text}}\namount={{amount}}\nsender={{sender}}",
      hint: "Kosongkan untuk menyimpan seluruh field data masuk apa adanya. Nilai mendukung {{template}}.",
    },
  ],
  supabase_query: [
    { key: "table", label: "Nama Tabel", placeholder: "expenses" },
    {
      key: "select",
      label: "Kolom Dipilih",
      placeholder: "*",
      hint: "Daftar kolom dipisah koma, atau * untuk semua.",
    },
    {
      key: "filters",
      label: "Filter (satu per baris: kolom operator nilai)",
      multiline: true,
      placeholder: "sender eq {{sender}}\namount gte 1000",
      hint: "Operator PostgREST: eq, gte, lte, like, dst.",
    },
    {
      key: "orderBy",
      label: "Urutkan (opsional)",
      placeholder: "created_at.desc",
    },
    { key: "limit", label: "Batas Baris (opsional)", placeholder: "50" },
  ],
  telegram_trigger: [
    {
      key: "info",
      label: "Info",
      placeholder: "",
      hint: "Saat ada pesan Telegram masuk, data tersedia sebagai {{sender}}, {{message}}, {{name}}. Daftarkan webhook bot di halaman kredensial Telegram.",
    },
  ],
  http_request: [
    { key: "url", label: "URL", placeholder: "https://api.example.com/data" },
    { key: "method", label: "Method", placeholder: "GET / POST / PUT" },
  ],
  whatsapp_send: [
    {
      key: "targetField",
      label: "Kolom Nomor Tujuan",
      columnSelect: true,
      hint: "Pilih kolom yang berisi nomor WhatsApp dari sheet.",
    },
    {
      key: "target",
      label: "Atau Nomor Manual / Template",
      placeholder: "628xxx atau {{Nomor}}",
    },
    {
      key: "message",
      label: "Pesan (dukung {{kolom}})",
      multiline: true,
      placeholder:
        "Halo {{Nama}} 👋\nReminder: {{Pesanan}} status {{Status Baru}}.",
    },
    { key: "countryCode", label: "Country Code", placeholder: "62" },
    {
      key: "reminderDelayMinutes",
      label: "Tunda Kirim (menit)",
      placeholder: "0 = kirim langsung",
      hint: "Jika diisi, pesan dijadwalkan setelah N menit. Saat jatuh tempo, data dicek ulang — jika kondisi sudah tidak terpenuhi (mis. sudah bayar), pengiriman dibatalkan otomatis.",
    },
    {
      key: "sendDelaySeconds",
      label: "Jeda Antar Pengiriman (detik)",
      placeholder: "2",
      hint: "Saat mengirim ke banyak nomor sekaligus, beri jeda antar pesan agar tidak terkirim di detik yang sama. Default 2 detik.",
    },
  ],
  whatsapp_trigger: [
    {
      key: "senderField",
      label: "Info",
      placeholder: "",
      hint: "Saat ada balasan WA, data tersedia sebagai {{sender}}, {{message}}, {{name}}. Hubungkan akun WhatsApp (Baileys) lewat scan QR di Setelan, atau pakai WhatsApp Cloud API (Meta).",
    },
  ],
  schedule: [
    {
      key: "executeDate",
      label: "Tanggal Eksekusi / Template",
      placeholder: "{{computedDate}}",
      hint: "Tanggal absolut atau {{computedDate}} dari Date Calculator.",
    },
    {
      key: "time",
      label: "Jam (HH:MM, opsional)",
      placeholder: "09:00",
    },
  ],
  wait_reply: [
    {
      key: "matchField",
      label: "Kolom Nomor Target",
      columnSelect: true,
      hint: "Nomor yang ditunggu balasannya, mis. Nomor.",
    },
    {
      key: "matchValue",
      label: "Atau Nomor Manual / Template",
      placeholder: "{{Nomor}}",
    },
    {
      key: "countryCode",
      label: "Kode Negara",
      selectOptions: COUNTRY_CODE_OPTIONS,
      hint: "Dipakai menyamakan format nomor lokal (mis. 08xxx) dengan balasan internasional (mis. 628xxx).",
    },
  ],
  telegram_send: [
    {
      key: "chatId",
      label: "Chat ID",
      placeholder: "123456789 atau {{ChatId}}",
    },
    { key: "text", label: "Pesan", multiline: true },
  ],
  google_sheets_create: [
    {
      key: "mode",
      label: "Mode",
      selectOptions: [
        { value: "new_spreadsheet", label: "Buat spreadsheet baru" },
        { value: "new_sheet", label: "Tambah sheet di spreadsheet yang ada" },
      ],
      hint: "Buat spreadsheet baru (dapat ID otomatis) atau tambah tab pada spreadsheet yang sudah ada.",
    },
    {
      key: "title",
      label: "Judul Spreadsheet (mode baru)",
      placeholder: "Catatan Keuangan {{name}}",
      hint: "Dipakai saat mode 'Buat spreadsheet baru'. Mendukung {{template}}.",
    },
    {
      key: "spreadsheetId",
      label: "Spreadsheet ID (mode tambah sheet)",
      placeholder: "1AbC...xyz",
      hint: "Dipakai saat mode 'Tambah sheet di spreadsheet yang ada'.",
    },
    {
      key: "sheetName",
      label: "Nama Sheet/Tab",
      placeholder: "Sheet1",
    },
  ],
  google_sheets_append: [
    { key: "spreadsheetId", label: "Spreadsheet ID" },
    { key: "sheetName", label: "Nama Sheet", placeholder: "Balasan" },
    {
      key: "columns",
      label: "Kolom (pisahkan koma)",
      placeholder: "sender,message,receivedAt",
      hint: "Nama field dari data masuk (mis. sender, message, name dari WA trigger). Baris baru ditulis mulai kolom A sesuai urutan ini.",
    },
  ],
  gmail_send: [
    {
      key: "to",
      label: "Penerima (to)",
      placeholder: "tujuan@email.com atau {{email}}",
      hint: "Wajib diisi. Mendukung {{template}} dari data masuk, mis. {{email}}.",
    },
    {
      key: "subject",
      label: "Subjek",
      placeholder: "Konfirmasi pesanan {{nama}}",
    },
    {
      key: "bodyType",
      label: "Tipe Isi",
      selectOptions: [
        { value: "text", label: "Teks Biasa" },
        { value: "html", label: "HTML Email" },
      ],
      hint: "Pilih HTML Email untuk template berformat dengan preview.",
    },
    {
      key: "body",
      label: "Isi Email",
      multiline: true,
      placeholder: "Halo {{nama}}, terima kasih sudah memesan.",
      htmlEmail: true,
    },
  ],
  google_calendar_create_event: [
    { key: "summary", label: "Judul Event", placeholder: "Rapat {{Nama}}" },
    {
      key: "startDateTime",
      label: "Mulai",
      placeholder: "Pilih tanggal & jam mulai",
      dateTime: true,
    },
    {
      key: "endDateTime",
      label: "Selesai",
      placeholder: "Pilih tanggal & jam selesai",
      dateTime: true,
    },
    { key: "timeZone", label: "Time Zone", placeholder: "Asia/Jakarta" },
    { key: "description", label: "Deskripsi", multiline: true },
  ],
  google_calendar_list_events: [
    { key: "maxResults", label: "Maks Event", placeholder: "10" },
    {
      key: "timeMin",
      label: "Mulai Dari (ISO, opsional)",
      placeholder: "2026-06-07T00:00:00Z",
    },
  ],
  schedule_trigger: [],
  function: [{ key: "code", label: "Kode JavaScript", multiline: true }],
  switch: [
    {
      key: "field",
      label: "Field yang Dievaluasi",
      placeholder: "status atau {{status}}",
      hint: "Nama field dari data masuk yang nilainya dibandingkan.",
    },
    {
      key: "value",
      label: "Nilai Target",
      placeholder: "approved atau {{target}}",
      hint: "Hanya baris dengan nilai field sama dengan ini yang diteruskan.",
    },
  ],
  merge: [],
  loop: [
    {
      key: "batchSize",
      label: "Ukuran Batch",
      placeholder: "1",
      hint: "Jumlah item per batch yang diproses bertahap. Default 1.",
    },
  ],
  no_op: [],
  slack_send: [
    {
      key: "webhookUrl",
      label: "Slack Incoming Webhook URL",
      placeholder: "https://hooks.slack.com/services/...",
      hint: "Buat di Slack: Apps → Incoming Webhooks.",
    },
    {
      key: "text",
      label: "Pesan",
      multiline: true,
      placeholder: "Ada lead baru: {{name}} dari {{company}}!",
    },
  ],
  discord_send: [
    {
      key: "webhookUrl",
      label: "Discord Webhook URL",
      placeholder: "https://discord.com/api/webhooks/...",
      hint: "Buat di Server Settings → Integrations → Webhooks.",
    },
    {
      key: "content",
      label: "Pesan",
      multiline: true,
      placeholder: "Notifikasi: {{message}}",
    },
  ],
  rss_read: [
    {
      key: "url",
      label: "URL Feed",
      placeholder: "https://techcrunch.com/feed/",
      hint: "Alamat RSS/Atom feed yang akan dibaca.",
    },
    {
      key: "limit",
      label: "Maks Item",
      placeholder: "20",
    },
  ],
  ai_openai: [
    {
      key: "provider",
      label: "Penyedia",
      selectOptions: [
        { value: "openai", label: "OpenAI" },
        { value: "openrouter", label: "OpenRouter" },
      ],
      hint: "OpenAI langsung, atau OpenRouter sebagai gateway multi-model.",
    },
    {
      key: "model",
      label: "Model",
      placeholder: "gpt-4o-mini",
    },
    {
      key: "systemInstruction",
      label: "Peran AI (System Instruction)",
      multiline: true,
      placeholder: "Kamu adalah asisten yang merangkum artikel dalam 3 poin.",
      hint: "Mendefinisikan persona/peran AI dan format balasan.",
    },
    {
      key: "prompt",
      label: "Prompt / Pesan",
      multiline: true,
      placeholder: "{{message}}",
      hint: "Pesan yang diproses AI. Gunakan {{template}} dari data masuk.",
    },
  ],
  ai_agent: [
    {
      key: "systemInstruction",
      label: "Peran AI (System Instruction)",
      multiline: true,
      placeholder:
        "Kamu adalah asisten otomasi yang membalas singkat dan jelas.",
      hint: "Mendefinisikan persona/peran AI dan format balasan.",
    },
    {
      key: "prompt",
      label: "Prompt / Pesan",
      multiline: true,
      placeholder: "{{message}}",
      hint: "Pesan yang diproses AI. Gunakan {{template}} dari data masuk.",
    },
  ],
};

const CONDITION_NODE_KINDS = new Set(["condition", "filter"]);

/**
 * Maps the chosen WhatsApp provider to the credential type it requires.
 * `baileys` sengaja tidak dipetakan karena memakai konfigurasi env (URL service
 * + API key), bukan kredensial per-user, sehingga pemilih kredensial tidak
 * ditampilkan untuk provider tersebut.
 */
const PROVIDER_TO_CREDENTIAL_TYPE = {
  meta: "whatsapp",
} as const;

const WHATSAPP_PROVIDER_OPTIONS = [
  { value: "meta", label: "WhatsApp Cloud API (Meta)" },
  { value: "baileys", label: "Self-host (Baileys)" },
];

const EMPTY_CONDITION_GROUP: ConditionGroup = { match: "all", rules: [] };

export function NodeConfigPanel({ node, onClose }: NodeConfigPanelProps) {
  const { updateNodeData, removeNode, getSheetSources, workflowId } =
    useWorkflowStore();

  const { resultByNodeId, runningNodeId, runNodeTest } = useNodeTestStore();

  const { credentials, fetchCredentials, credentialsByType } =
    useCredentialStore();

  const {
    fetchColumns,
    dataBySpreadsheet,
    getColumnValues,
    isLoading: isLoadingColumns,
  } = useSheetColumnsStore();

  const { fetchPreview, fetchSheetList } = useSheetPreviewStore();

  const handlePreviewData = () => {
    const spreadsheetId = String(node.data.config.spreadsheetId ?? "");
    const credentialId = node.data.credentialId ?? "";
    const sheetName = String(node.data.config.sheetName ?? "");

    if (spreadsheetId && credentialId) {
      fetchSheetList({ credentialId, spreadsheetId });
      fetchPreview({ credentialId, spreadsheetId, sheetName });
    }
  };

  const nodeTypeDefinition = getNodeTypeDef(node.data.kind);
  const configFields = CONFIG_FIELDS[node.data.kind] ?? [];

  /**
   * Operasi sejenis (family + kategori sama). Bila lebih dari satu, panel
   * menampilkan dropdown Operation untuk berpindah operasi tanpa menambah node.
   */
  const siblingOperations = getSiblingOperations(node.data.kind);

  const handleOperationChange = (nextKind: string) => {
    const currentDefinition = getNodeTypeDef(node.data.kind);
    const nextDefinition = getNodeTypeDef(nextKind as NodeKind);

    const shouldSyncLabel =
      !node.data.label || node.data.label === currentDefinition?.label;

    updateNodeData(node.id, {
      kind: nextKind as NodeKind,
      ...(shouldSyncLabel && nextDefinition
        ? { label: nextDefinition.label }
        : {}),
    });
  };

  const isWhatsAppSend = node.data.kind === "whatsapp_send";
  const selectedProvider = String(node.data.config.provider ?? "whapi");

  /** For Send WhatsApp the credential type follows the provider dropdown. */
  const effectiveCredentialType = isWhatsAppSend
    ? PROVIDER_TO_CREDENTIAL_TYPE[
        selectedProvider as keyof typeof PROVIDER_TO_CREDENTIAL_TYPE
      ]
    : nodeTypeDefinition?.credentialType;
  const usesConditionBuilder = CONDITION_NODE_KINDS.has(node.data.kind);
  const isSheetReadNode = node.data.kind === "google_sheets_read";
  const isSheetUpdateNode = node.data.kind === "google_sheets_update";
  const isDateCalculator = node.data.kind === "date_calculator";
  const isTransform = node.data.kind === "transform";
  const isConditionNode = node.data.kind === "condition";
  const isScheduleTrigger = node.data.kind === "schedule_trigger";
  const conditionMode = String(node.data.config.mode ?? "visual");

  const sheetSources = getSheetSources();

  const COMMON_TRIGGER_FIELDS = ["sender", "message", "name"];

  /** Header kolom asli yang berhasil dimuat dari spreadsheet sumber. */
  const sheetColumns = Array.from(
    new Set(
      sheetSources.flatMap(
        (source) => dataBySpreadsheet[source.spreadsheetId]?.headers ?? [],
      ),
    ),
  );

  /**
   * Field yang berasal dari pesan/chat masuk (trigger), bukan kolom spreadsheet.
   * Dipisah agar dropdown bisa mengelompokkannya dengan jelas.
   */
  const triggerFields = COMMON_TRIGGER_FIELDS;

  const availableColumns = Array.from(
    new Set([...triggerFields, ...sheetColumns]),
  );

  const handleRefreshColumns = () => {
    sheetSources.forEach((source) => fetchColumns({ ...source, force: true }));
  };

  /** Variables offered by the picker: system values + known sheet columns. */
  const columnVariables = availableColumns.map(
    (column) => `payload['${column}']`,
  );

  const variableGroups: VariableGroup[] = [
    {
      label: "Sistem",
      variables: ["$now", "$workflow.id", "$execution.id"],
    },
    ...(columnVariables.length > 0
      ? [{ label: "Kolom & Data", variables: columnVariables }]
      : []),
  ];

  /** Sample context used to render live expression previews. */
  const samplePayload: Record<string, unknown> = {};

  availableColumns.forEach((column) => {
    samplePayload[column] = `<${column}>`;
  });

  const previewContext = {
    payload: samplePayload,
    $workflow: { id: workflowId ?? "" },
    $execution: { id: "preview" },
  };

  /** Column value lookup across all known spreadsheets (for value dropdowns). */
  const lookupColumnValues = (column: string): string[] => {
    for (const source of sheetSources) {
      const values = getColumnValues(source.spreadsheetId, column);

      if (values.length > 0) {
        return values;
      }
    }

    return [];
  };

  useEffect(() => {
    if (effectiveCredentialType && credentials.length === 0) {
      fetchCredentials();
    }
  }, [effectiveCredentialType, credentials.length, fetchCredentials]);

  /** Auto-fetch on mount (non-force, skip if already cached). */
  useEffect(() => {
    sheetSources.forEach((source) => {
      if (!dataBySpreadsheet[source.spreadsheetId]) {
        fetchColumns(source);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sheetSources), fetchColumns]);

  /** Auto-refresh columns when spreadsheetId or credentialId changes. */
  useEffect(() => {
    const spreadsheetId = String(node.data.config.spreadsheetId ?? "").trim();
    const credentialId = node.data.credentialId ?? "";

    if (spreadsheetId && credentialId) {
      fetchColumns({ spreadsheetId, credentialId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.data.config.spreadsheetId, node.data.credentialId]);

  const updateConfigValue = (configKey: string, configValue: unknown) =>
    updateNodeData(node.id, {
      config: { ...node.data.config, [configKey]: configValue },
    });

  const updateConfigValuesBatch = (updates: Record<string, unknown>) =>
    updateNodeData(node.id, {
      config: { ...node.data.config, ...updates },
    });

  const validationIssues = validateNodeData(node.data);
  const testResult = resultByNodeId[node.id];
  const isTestRunning = runningNodeId === node.id;

  const handleTestNode = () =>
    runNodeTest({
      workflowId: workflowId ?? "test-workflow",
      node,
      sampleInput: previewContext.payload,
      sheetSources,
    });

  const transformMappings = Array.isArray(node.data.config.mappings)
    ? (node.data.config.mappings as TransformMapping[])
    : [];

  const updateConditions = (nextGroup: ConditionGroup) =>
    updateNodeData(node.id, {
      config: { ...node.data.config, conditions: nextGroup },
    });

  const credentialOptions = effectiveCredentialType
    ? credentialsByType(effectiveCredentialType)
    : [];

  const currentConditions =
    (node.data.config.conditions as ConditionGroup | undefined) ??
    EMPTY_CONDITION_GROUP;

  const selectedReadColumns = Array.isArray(node.data.config.readColumns)
    ? (node.data.config.readColumns as string[])
    : [];

  return (
    <>
      <aside className="border-border bg-card flex w-80 shrink-0 flex-col overflow-hidden rounded-xl border shadow-sm">
        <div className="border-border flex shrink-0 items-center justify-between border-b px-4 py-3">
          <h2 className="text-foreground text-sm font-semibold">
            Node Properties
          </h2>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Tutup panel"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <ScrollArea className="h-full flex-1">
          <div className="flex flex-col gap-4 p-4 pb-20">
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Label
              </label>

              <Input
                value={node.data.label}
                onChange={(changeEvent) =>
                  updateNodeData(node.id, { label: changeEvent.target.value })
                }
              />

              <p className="text-muted-foreground mt-1.5 text-xs">
                {nodeTypeDefinition?.description}
              </p>
            </div>

            {node.data.ref && (
              <div className="border-border bg-muted/40 rounded-md border px-3 py-2">
                <p className="text-muted-foreground text-xs">
                  Referensi node:{" "}
                  <code className="text-foreground font-mono font-semibold">
                    {node.data.ref}
                  </code>
                </p>

                <p className="text-muted-foreground mt-1 text-[11px]">
                  Pakai di node lain dengan{" "}
                  <code className="font-mono">
                    {`{{${node.data.ref}.field}}`}
                  </code>{" "}
                  untuk memakai output node ini (mis.{" "}
                  <code className="font-mono">
                    {`{{${node.data.ref}.spreadsheetId}}`}
                  </code>
                  ).
                </p>
              </div>
            )}

            {siblingOperations.length > 1 && (
              <div>
                <label className="text-muted-foreground mb-1 block text-xs font-medium">
                  Operation
                </label>

                <Select
                  value={node.data.kind}
                  onValueChange={handleOperationChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="\u2014 pilih operasi \u2014" />
                  </SelectTrigger>

                  <SelectContent>
                    {siblingOperations.map((operation) => (
                      <SelectItem key={operation.kind} value={operation.kind}>
                        {operation.operationLabel ?? operation.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-muted-foreground mt-1.5 text-xs">
                  Pilih operasi untuk node ini. Konfigurasi di bawah
                  menyesuaikan pilihan.
                </p>
              </div>
            )}

            {isWhatsAppSend && (
              <div>
                <label className="text-muted-foreground mb-1 block text-xs font-medium">
                  Provider
                </label>

                <Select
                  value={selectedProvider}
                  onValueChange={(provider) => {
                    updateNodeData(node.id, {
                      credentialId: "",
                      config: { ...node.data.config, provider },
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="— Pilih provider —" />
                  </SelectTrigger>

                  <SelectContent>
                    {WHATSAPP_PROVIDER_OPTIONS.map((providerOption) => (
                      <SelectItem
                        key={providerOption.value}
                        value={providerOption.value}
                      >
                        {providerOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {node.data.kind === "ai_agent" && (
              <AiAgentCredentials
                selectedIds={
                  Array.isArray(node.data.config.credentialIds)
                    ? (node.data.config.credentialIds as string[])
                    : []
                }
                onChange={(credentialIds) =>
                  updateConfigValue("credentialIds", credentialIds)
                }
              />
            )}

            {effectiveCredentialType && node.data.kind !== "ai_agent" && (
              <div>
                <label className="text-muted-foreground mb-1 block text-xs font-medium">
                  Kredensial
                </label>

                <Select
                  value={node.data.credentialId ?? ""}
                  onValueChange={(credentialId) =>
                    updateNodeData(node.id, { credentialId })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="— Pilih kredensial —" />
                  </SelectTrigger>

                  <SelectContent>
                    {credentialOptions.map((credential) => (
                      <SelectItem key={credential.id} value={credential.id}>
                        {credential.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {credentialOptions.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    Belum ada kredensial untuk konektor ini. Tambahkan di
                    halaman Credentials.
                  </p>
                )}
              </div>
            )}

            {/* Google Sheets Read & Update share: Spreadsheet ID + Nama Sheet */}
            {(isSheetReadNode || isSheetUpdateNode) && (
              <>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    Spreadsheet ID
                  </label>

                  <div className="flex items-center gap-2">
                    <Input
                      value={String(node.data.config.spreadsheetId ?? "")}
                      placeholder="1BxiMVs0XRA5nFMdKvBdBZjg..."
                      onChange={(changeEvent) =>
                        updateConfigValue(
                          "spreadsheetId",
                          changeEvent.target.value,
                        )
                      }
                    />

                    <Button
                      variant="outline"
                      size="icon-sm"
                      type="button"
                      title="Preview data spreadsheet"
                      disabled={
                        !node.data.config.spreadsheetId ||
                        !node.data.credentialId
                      }
                      onClick={handlePreviewData}
                    >
                      <TableIcon className="size-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    Nama Sheet
                  </label>

                  <Input
                    value={String(node.data.config.sheetName ?? "")}
                    placeholder="Sheet1"
                    onChange={(changeEvent) =>
                      updateConfigValue("sheetName", changeEvent.target.value)
                    }
                  />

                  <p className="text-muted-foreground mt-1 text-xs">
                    Membaca seluruh kolom otomatis dari sheet ini.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRefreshColumns}
                  className="text-primary self-start text-xs hover:underline disabled:opacity-50"
                  disabled={isLoadingColumns}
                >
                  {isLoadingColumns ? "Memuat..." : "↻ Muat kolom sheet"}
                </button>
              </>
            )}

            {/* Read node: pick which columns to read */}
            {isSheetReadNode && (
              <>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    Kolom yang Dibaca
                  </label>

                  <MultiSelect
                    options={availableColumns}
                    value={selectedReadColumns}
                    onChange={(next) => updateConfigValue("readColumns", next)}
                    placeholder="Semua kolom (default)"
                  />

                  <p className="text-muted-foreground mt-1 text-xs">
                    Kosongkan untuk membaca semua kolom.
                  </p>
                </div>

                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    Maks Baris
                  </label>

                  <Input
                    value={String(node.data.config.limit ?? "")}
                    placeholder="100"
                    onChange={(changeEvent) =>
                      updateConfigValue("limit", changeEvent.target.value)
                    }
                  />
                </div>
              </>
            )}

            {/* Update node: pick columns to write + values */}
            {isSheetUpdateNode && (
              <>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    Cari Baris Berdasarkan Kolom (opsional)
                  </label>

                  <Select
                    value={
                      String(node.data.config.matchColumn ?? "") || "_none"
                    }
                    onValueChange={(columnValue) =>
                      updateConfigValue(
                        "matchColumn",
                        columnValue === "_none" ? "" : columnValue,
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="— tidak perlu (pakai baris dari Read) —" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="_none">
                        — tidak perlu (pakai baris dari Read) —
                      </SelectItem>

                      {availableColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <p className="text-muted-foreground mt-1 text-xs">
                    Gunakan ini untuk balasan WA: cari baris yang kolomnya cocok
                    dengan nilai di bawah (mis. kolom Nomor = {"{{sender}}"}).
                  </p>
                </div>

                {String(node.data.config.matchColumn ?? "") && (
                  <div>
                    <label className="text-muted-foreground mb-1 block text-xs font-medium">
                      Nilai yang Dicari
                    </label>

                    <Input
                      value={String(node.data.config.matchValue ?? "")}
                      placeholder="{{sender}}"
                      onChange={(changeEvent) =>
                        updateConfigValue(
                          "matchValue",
                          changeEvent.target.value,
                        )
                      }
                    />
                  </div>
                )}

                <SheetWriteTargets
                  availableColumns={availableColumns}
                  value={
                    Array.isArray(node.data.config.writeTargets)
                      ? (node.data.config.writeTargets as WriteTarget[])
                      : []
                  }
                  onChange={(next: WriteTarget[]) =>
                    updateConfigValue("writeTargets", next)
                  }
                />
              </>
            )}

            {usesConditionBuilder && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-muted-foreground block text-xs font-medium">
                    Kondisi
                  </label>

                  {sheetSources.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRefreshColumns}
                      className="text-primary text-xs hover:underline disabled:opacity-50"
                      disabled={isLoadingColumns}
                    >
                      {isLoadingColumns ? "Memuat..." : "↻ Muat kolom sheet"}
                    </button>
                  )}
                </div>

                {isConditionNode && (
                  <Tabs
                    value={conditionMode === "code" ? "code" : "visual"}
                    onValueChange={(mode) => updateConfigValue("mode", mode)}
                    className="mb-3"
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value="visual" className="flex-1">
                        Visual
                      </TabsTrigger>
                      <TabsTrigger value="code" className="flex-1">
                        Code
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}

                {isConditionNode && conditionMode === "code" ? (
                  <ExpressionInput
                    value={String(node.data.config.expression ?? "")}
                    placeholder={'payload["Status"] === "Belum Dibayar"'}
                    multiline
                    rawExpression
                    variableGroups={variableGroups}
                    previewContext={previewContext}
                    onChange={(next) => updateConfigValue("expression", next)}
                  />
                ) : (
                  <ConditionBuilder
                    value={currentConditions}
                    availableColumns={availableColumns}
                    getColumnValues={lookupColumnValues}
                    onChange={updateConditions}
                  />
                )}

                {availableColumns.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    Kolom belum tersedia. Pastikan node Google Sheets sudah
                    punya Kredensial + Spreadsheet ID, lalu klik &quot;Muat
                    kolom sheet&quot;.
                  </p>
                )}

                <p className="text-muted-foreground mt-1.5 text-xs">
                  {node.data.kind === "filter"
                    ? "Hanya baris yang lolos kondisi yang diteruskan ke node berikutnya."
                    : "Flow lanjut ke node berikutnya hanya jika ada baris yang cocok."}
                </p>
              </div>
            )}

            {isDateCalculator && (
              <DateCalculatorConfig
                config={node.data.config}
                availableColumns={availableColumns}
                onConfigChange={updateConfigValue}
              />
            )}

            {isTransform && (
              <TransformConfig
                mode={String(node.data.config.mode ?? "keyvalue")}
                mappings={transformMappings}
                code={String(node.data.config.code ?? "")}
                variableGroups={variableGroups}
                previewContext={previewContext}
                onModeChange={(mode) => updateConfigValue("mode", mode)}
                onMappingsChange={(next) => updateConfigValue("mappings", next)}
                onCodeChange={(next) => updateConfigValue("code", next)}
              />
            )}

            {isScheduleTrigger && (
              <ScheduleTriggerConfig
                config={node.data.config}
                onConfigChange={updateConfigValuesBatch}
              />
            )}

            {configFields.map((configField) => (
              <div key={configField.key}>
                <label className="text-muted-foreground mb-1 block text-xs font-medium">
                  {configField.label}
                </label>

                {configField.htmlEmail &&
                String(node.data.config.bodyType ?? "text") === "html" ? (
                  <HtmlEmailDialog
                    value={String(node.data.config[configField.key] ?? "")}
                    onChange={(html) =>
                      updateConfigValue(configField.key, html)
                    }
                  />
                ) : configField.dateTime ? (
                  <DateTimePicker
                    value={String(node.data.config[configField.key] ?? "")}
                    placeholder={configField.placeholder}
                    onChange={(isoValue) =>
                      updateConfigValue(configField.key, isoValue)
                    }
                  />
                ) : configField.selectOptions ? (
                  <Select
                    value={String(
                      node.data.config[configField.key] ??
                        configField.selectOptions[0]?.value ??
                        "",
                    )}
                    onValueChange={(value) =>
                      updateConfigValue(configField.key, value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="\u2014 pilih \u2014" />
                    </SelectTrigger>

                    <SelectContent>
                      {configField.selectOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : configField.columnSelect ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(node.data.config[configField.key] ?? "")}
                      onValueChange={(value) =>
                        updateConfigValue(configField.key, value)
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="— pilih kolom —" />
                      </SelectTrigger>

                      <SelectContent>
                        {availableColumns.length === 0 ? (
                          <SelectItem value="_none" disabled>
                            Belum ada kolom — klik ↻ Muat
                          </SelectItem>
                        ) : (
                          <>
                            {sheetColumns.length > 0 && (
                              <SelectGroup>
                                <SelectLabel>Kolom Spreadsheet</SelectLabel>

                                {sheetColumns.map((column) => (
                                  <SelectItem key={column} value={column}>
                                    {column}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )}

                            <SelectGroup>
                              <SelectLabel>Field dari Chat Masuk</SelectLabel>

                              {triggerFields.map((field) => (
                                <SelectItem key={field} value={field}>
                                  {field}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </>
                        )}
                      </SelectContent>
                    </Select>

                    {sheetSources.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRefreshColumns}
                        className="text-primary shrink-0 text-sm hover:underline disabled:opacity-50"
                        disabled={isLoadingColumns}
                        title="Muat ulang kolom dari spreadsheet"
                      >
                        ↻
                      </button>
                    )}
                  </div>
                ) : configField.multiline ? (
                  <Textarea
                    rows={5}
                    className="font-mono text-xs"
                    value={String(node.data.config[configField.key] ?? "")}
                    placeholder={configField.placeholder}
                    onChange={(changeEvent) =>
                      updateConfigValue(
                        configField.key,
                        changeEvent.target.value,
                      )
                    }
                  />
                ) : configField.key === "spreadsheetId" ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={String(node.data.config[configField.key] ?? "")}
                      placeholder={configField.placeholder}
                      onChange={(changeEvent) =>
                        updateConfigValue(
                          configField.key,
                          changeEvent.target.value,
                        )
                      }
                    />

                    <Button
                      variant="outline"
                      size="icon-sm"
                      type="button"
                      title="Preview data spreadsheet"
                      disabled={
                        !node.data.config[configField.key] ||
                        !node.data.credentialId
                      }
                      onClick={handlePreviewData}
                    >
                      <TableIcon className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <Input
                    value={String(node.data.config[configField.key] ?? "")}
                    placeholder={configField.placeholder}
                    onChange={(changeEvent) =>
                      updateConfigValue(
                        configField.key,
                        changeEvent.target.value,
                      )
                    }
                  />
                )}

                {configField.hint && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {configField.hint}
                  </p>
                )}
              </div>
            ))}

            {/* Validation issues */}
            {validationIssues.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                  <AlertTriangleIcon className="size-3.5" />
                  Perlu diperbaiki
                </div>

                {validationIssues.map((issue) => (
                  <p key={issue.field} className="text-[11px] text-amber-700">
                    • {issue.message}
                  </p>
                ))}
              </div>
            )}

            {/* Per-node Test Run */}
            <div className="border-border bg-muted/20 flex flex-col gap-2 rounded-md border p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-xs font-semibold">
                  Test Node
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={handleTestNode}
                  disabled={isTestRunning}
                >
                  {isTestRunning ? (
                    <Spinner className="size-3.5" />
                  ) : (
                    <PlayIcon className="size-3.5" />
                  )}
                  {isTestRunning ? "Menjalankan…" : "Jalankan Test"}
                </Button>
              </div>

              {testResult && (
                <div
                  className={cn(
                    "max-h-48 overflow-auto rounded-md border p-2 font-mono text-[10px]",
                    testResult.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-700",
                  )}
                >
                  <pre className="break-all whitespace-pre-wrap">
                    {testResult.ok
                      ? JSON.stringify(testResult.output, null, 2)
                      : testResult.error}
                  </pre>
                </div>
              )}

              <p className="text-muted-foreground text-[11px]">
                Menjalankan node ini saja dengan data contoh. Node konektor
                tetap memanggil API aslinya.
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                removeNode(node.id);
                onClose();
              }}
            >
              <Trash2Icon />
              Hapus Node
            </Button>
          </div>
        </ScrollArea>
      </aside>
      <SpreadsheetPreviewDrawer />
    </>
  );
}
