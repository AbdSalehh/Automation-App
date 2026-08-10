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
  SimpleTooltip,
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
import { useWhatsappSessionStore } from "@/entities/whatsapp-session";
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
  { value: "65", label: "\uD83C\uDDF8\uD83C\uDDEC Singapore (+65)" },
  { value: "63", label: "\uD83C\uDDF5\uD83C\uDDED Philippines (+63)" },
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
      label: "AI Role (System Instruction)",
      multiline: true,
      placeholder:
        "You are an assistant that records expenses. Extract the item name and price from the message.",
      hint: "Defines the AI persona/role and the expected response format.",
    },
    {
      key: "prompt",
      label: "Prompt / Message",
      multiline: true,
      placeholder: "{{message}}",
      hint: "The message processed by the AI. Use {{message}} for the incoming message content.",
    },
    {
      key: "model",
      label: "Model (optional)",
      selectOptions: GEMINI_MODELS,
      hint: "Flash-Lite is suitable when Flash is busy (high-traffic).",
    },
  ],
  supabase_insert: [
    { key: "table", label: "Table Name", placeholder: "expenses" },
    {
      key: "columns",
      label: "Columns (one per line: column=value)",
      multiline: true,
      placeholder: "item={{text}}\namount={{amount}}\nsender={{sender}}",
      hint: "Leave blank to store all incoming data fields as-is. Values support {{template}}.",
    },
  ],
  supabase_query: [
    { key: "table", label: "Table Name", placeholder: "expenses" },
    {
      key: "select",
      label: "Selected Columns",
      placeholder: "*",
      hint: "Comma-separated list of columns, or * for all.",
    },
    {
      key: "filters",
      label: "Filter (one per line: column operator value)",
      multiline: true,
      placeholder: "sender eq {{sender}}\namount gte 1000",
      hint: "PostgREST operators: eq, gte, lte, like, etc.",
    },
    {
      key: "orderBy",
      label: "Sort (optional)",
      placeholder: "created_at.desc",
    },
    { key: "limit", label: "Row Limit (optional)", placeholder: "50" },
  ],
  telegram_trigger: [
    {
      key: "info",
      label: "Info",
      placeholder: "",
      hint: "When a Telegram message arrives, data is available as {{sender}}, {{message}}, {{name}}. Register the bot webhook on the Telegram credentials page.",
    },
  ],
  http_request: [
    { key: "url", label: "URL", placeholder: "https://api.example.com/data" },
    { key: "method", label: "Method", placeholder: "GET / POST / PUT" },
  ],
  whatsapp_send: [
    {
      key: "targetField",
      label: "Destination Number Column",
      columnSelect: true,
      hint: "Select the column containing the WhatsApp number from the sheet.",
    },
    {
      key: "target",
      label: "Or Manual Number / Template",
      placeholder: "628xxx or {{Number}}",
    },
    {
      key: "message",
      label: "Message (supports {{column}})",
      multiline: true,
      placeholder:
        "Hello {{Name}} 👋\nReminder: {{Order}} status {{New Status}}.",
    },
    { key: "countryCode", label: "Country Code", placeholder: "62" },
    {
      key: "reminderDelayMinutes",
      label: "Send Delay (minutes)",
      placeholder: "0 = send immediately",
      hint: "If set, the message is scheduled after N minutes. When it is due, the data is rechecked — if the condition is no longer met (e.g. already paid), sending is canceled automatically.",
    },
    {
      key: "sendDelaySeconds",
      label: "Delay Between Sends (seconds)",
      placeholder: "2",
      hint: "When sending to many numbers at once, add a delay between messages so they are not sent at the same second. Default 2 seconds.",
    },
  ],
  whatsapp_trigger: [
    {
      key: "senderField",
      label: "Info",
      placeholder: "",
      hint: "When a WhatsApp reply arrives, data is available as {{sender}}, {{message}}, {{name}}. Connect your WhatsApp account (Baileys) via QR scan in Settings, or use the WhatsApp Cloud API (Meta).",
    },
  ],
  schedule: [
    {
      key: "executeDate",
      label: "Execution Date / Template",
      placeholder: "{{computedDate}}",
      hint: "Absolute date or {{computedDate}} from the Date Calculator.",
    },
    {
      key: "time",
      label: "Time (HH:MM, optional)",
      placeholder: "09:00",
    },
  ],
  wait_reply: [
    {
      key: "matchField",
      label: "Target Number Column",
      columnSelect: true,
      hint: "The number whose reply is awaited, e.g. Number.",
    },
    {
      key: "matchValue",
      label: "Or Manual Number / Template",
      placeholder: "{{Number}}",
    },
    {
      key: "countryCode",
      label: "Country Code",
      selectOptions: COUNTRY_CODE_OPTIONS,
      hint: "Used to align local number formats (e.g. 08xxx) with international replies (e.g. 628xxx).",
    },
  ],
  telegram_send: [
    {
      key: "chatId",
      label: "Chat ID",
      placeholder: "123456789 or {{ChatId}}",
    },
    { key: "text", label: "Message", multiline: true },
  ],
  google_sheets_create: [
    {
      key: "mode",
      label: "Mode",
      selectOptions: [
        { value: "new_spreadsheet", label: "Create new spreadsheet" },
        { value: "new_sheet", label: "Add sheet to an existing spreadsheet" },
      ],
      hint: "Create a new spreadsheet (auto-generated ID) or add a tab to an existing spreadsheet.",
    },
    {
      key: "title",
      label: "Spreadsheet Title (new mode)",
      placeholder: "Financial Records {{name}}",
      hint: "Used in 'Create new spreadsheet' mode. Supports {{template}}.",
    },
    {
      key: "spreadsheetId",
      label: "Spreadsheet ID (add sheet mode)",
      placeholder: "1AbC...xyz",
      hint: "Used in 'Add sheet to an existing spreadsheet' mode.",
    },
    {
      key: "sheetName",
      label: "Sheet/Tab Name",
      placeholder: "Sheet1",
    },
  ],
  google_sheets_append: [
    { key: "spreadsheetId", label: "Spreadsheet ID" },
    { key: "sheetName", label: "Sheet Name", placeholder: "Replies" },
    {
      key: "columns",
      label: "Columns (comma-separated)",
      placeholder: "sender,message,receivedAt",
      hint: "Field names from the incoming data (e.g. sender, message, name from the WA trigger). New rows are written starting at column A in this order.",
    },
  ],
  gmail_send: [
    {
      key: "to",
      label: "Recipient (to)",
      placeholder: "recipient@email.com or {{email}}",
      hint: "Required. Supports {{template}} from incoming data, e.g. {{email}}.",
    },
    {
      key: "subject",
      label: "Subject",
      placeholder: "Order confirmation {{name}}",
    },
    {
      key: "bodyType",
      label: "Body Type",
      selectOptions: [
        { value: "text", label: "Plain Text" },
        { value: "html", label: "HTML Email" },
      ],
      hint: "Choose HTML Email for a formatted template with preview.",
    },
    {
      key: "body",
      label: "Email Body",
      multiline: true,
      placeholder: "Hello {{name}}, thank you for your order.",
      htmlEmail: true,
    },
  ],
  google_calendar_create_event: [
    { key: "summary", label: "Event Title", placeholder: "Meeting {{Name}}" },
    {
      key: "startDateTime",
      label: "Start",
      placeholder: "Select start date & time",
      dateTime: true,
    },
    {
      key: "endDateTime",
      label: "End",
      placeholder: "Select end date & time",
      dateTime: true,
    },
    { key: "timeZone", label: "Time Zone", placeholder: "Asia/Jakarta" },
    { key: "description", label: "Description", multiline: true },
  ],
  google_calendar_list_events: [
    { key: "maxResults", label: "Max Events", placeholder: "10" },
    {
      key: "timeMin",
      label: "Start From (ISO, optional)",
      placeholder: "2026-06-07T00:00:00Z",
    },
  ],
  schedule_trigger: [],
  function: [{ key: "code", label: "JavaScript Code", multiline: true }],
  switch: [
    {
      key: "field",
      label: "Field to Evaluate",
      placeholder: "status or {{status}}",
      hint: "Name of the incoming data field whose value is compared.",
    },
    {
      key: "value",
      label: "Target Value",
      placeholder: "approved or {{target}}",
      hint: "Only rows whose field value equals this are forwarded.",
    },
  ],
  merge: [],
  loop: [
    {
      key: "batchSize",
      label: "Batch Size",
      placeholder: "1",
      hint: "Number of items per batch processed incrementally. Default 1.",
    },
  ],
  no_op: [],
  slack_send: [
    {
      key: "webhookUrl",
      label: "Slack Incoming Webhook URL",
      placeholder: "https://hooks.slack.com/services/...",
      hint: "Create in Slack: Apps → Incoming Webhooks.",
    },
    {
      key: "text",
      label: "Message",
      multiline: true,
      placeholder: "New lead: {{name}} from {{company}}!",
    },
  ],
  discord_send: [
    {
      key: "webhookUrl",
      label: "Discord Webhook URL",
      placeholder: "https://discord.com/api/webhooks/...",
      hint: "Create in Server Settings → Integrations → Webhooks.",
    },
    {
      key: "content",
      label: "Message",
      multiline: true,
      placeholder: "Notification: {{message}}",
    },
  ],
  rss_read: [
    {
      key: "url",
      label: "Feed URL",
      placeholder: "https://techcrunch.com/feed/",
      hint: "The RSS/Atom feed address to read.",
    },
    {
      key: "limit",
      label: "Max Items",
      placeholder: "20",
    },
  ],
  ai_openai: [
    {
      key: "provider",
      label: "Provider",
      selectOptions: [
        { value: "openai", label: "OpenAI" },
        { value: "openrouter", label: "OpenRouter" },
      ],
      hint: "OpenAI directly, or OpenRouter as a multi-model gateway.",
    },
    {
      key: "model",
      label: "Model",
      placeholder: "gpt-4o-mini",
    },
    {
      key: "systemInstruction",
      label: "AI Role (System Instruction)",
      multiline: true,
      placeholder: "You are an assistant that summarizes articles in 3 points.",
      hint: "Defines the AI persona/role and response format.",
    },
    {
      key: "prompt",
      label: "Prompt / Message",
      multiline: true,
      placeholder: "{{message}}",
      hint: "The message processed by the AI. Use {{template}} from incoming data.",
    },
  ],
  ai_agent: [
    {
      key: "systemInstruction",
      label: "AI Role (System Instruction)",
      multiline: true,
      placeholder:
        "You are an automation assistant that replies concisely and clearly.",
      hint: "Defines the AI persona/role and response format.",
    },
    {
      key: "prompt",
      label: "Prompt / Message",
      multiline: true,
      placeholder: "{{message}}",
      hint: "The message processed by the AI. Use {{template}} from incoming data.",
    },
  ],
};

const CONDITION_NODE_KINDS = new Set(["condition", "filter"]);

const EMPTY_CONDITION_GROUP: ConditionGroup = { match: "all", rules: [] };

export function NodeConfigPanel({ node, onClose }: NodeConfigPanelProps) {
  const { updateNodeData, removeNode, getSheetSources, workflowId } =
    useWorkflowStore();

  const { resultByNodeId, runningNodeId, runNodeTest } = useNodeTestStore();

  const { credentials, fetchCredentials, credentialsByType } =
    useCredentialStore();

  const { sessions: whatsappSessions, loadSessions: loadWhatsappSessions } =
    useWhatsappSessionStore();

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
  const effectiveCredentialType = isWhatsAppSend
    ? undefined
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

  useEffect(() => {
    if (isWhatsAppSend) {
      void loadWhatsappSessions();
    }
  }, [isWhatsAppSend, loadWhatsappSessions]);

  /** Auto-fetch on mount (non-force, skip if already cached). */
  useEffect(() => {
    sheetSources.forEach((source) => {
      if (!dataBySpreadsheet[source.spreadsheetId]) {
        fetchColumns(source);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sheetSources), fetchColumns]);

  /** Auto-refresh columns when spreadsheetId, credentialId, or sheet changes. */
  useEffect(() => {
    const spreadsheetId = String(node.data.config.spreadsheetId ?? "").trim();
    const credentialId = node.data.credentialId ?? "";
    const sheetName = node.data.config.sheetName
      ? String(node.data.config.sheetName).trim()
      : undefined;

    if (spreadsheetId && credentialId) {
      fetchColumns({ spreadsheetId, credentialId, sheetName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    node.data.config.spreadsheetId,
    node.data.credentialId,
    node.data.config.sheetName,
  ]);

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
            aria-label="Close panel"
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
                  Node reference:{" "}
                  <code className="text-foreground font-mono font-semibold">
                    {node.data.ref}
                  </code>
                </p>

                <p className="text-muted-foreground mt-1 text-[11px]">
                  Use in another node with{" "}
                  <code className="font-mono">
                    {`{{${node.data.ref}.field}}`}
                  </code>{" "}
                  to use this node's output (e.g.{" "}
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
                    <SelectValue placeholder="\u2014 select operation \u2014" />
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
                  Select an operation for this node. The configuration below
                  adapts to your choice.
                </p>
              </div>
            )}

            {isWhatsAppSend && (
              <div>
                <label className="text-muted-foreground mb-1 block text-xs font-medium">
                  Account
                </label>

                <Select
                  value={String(node.data.config.sessionId ?? "")}
                  onValueChange={(sessionId) =>
                    updateConfigValuesBatch({ sessionId, provider: "baileys" })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="— Select WhatsApp account —" />
                  </SelectTrigger>

                  <SelectContent>
                    {whatsappSessions
                      .filter((whatsappSession) => whatsappSession.isReady)
                      .map((whatsappSession) => (
                        <SelectItem
                          key={whatsappSession.sessionId}
                          value={whatsappSession.sessionId}
                        >
                          {whatsappSession.name || "WhatsApp Account"}
                          {whatsappSession.phoneNumber
                            ? ` (${whatsappSession.phoneNumber})`
                            : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {!whatsappSessions.some(
                  (whatsappSession) => whatsappSession.isReady,
                ) && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    No connected WhatsApp accounts. Link one in Settings.
                  </p>
                )}
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
                  Credential
                </label>

                <Select
                  value={node.data.credentialId ?? ""}
                  onValueChange={(credentialId) =>
                    updateNodeData(node.id, { credentialId })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="— Select credential —" />
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
                    No credentials for this connector yet. Add one on the
                    Credentials page.
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

                    <SimpleTooltip label="Preview spreadsheet data">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        type="button"
                        disabled={
                          !node.data.config.spreadsheetId ||
                          !node.data.credentialId
                        }
                        onClick={handlePreviewData}
                      >
                        <TableIcon className="size-4" />
                      </Button>
                    </SimpleTooltip>
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    Sheet Name
                  </label>

                  <Input
                    value={String(node.data.config.sheetName ?? "")}
                    placeholder="Sheet1"
                    onChange={(changeEvent) =>
                      updateConfigValue("sheetName", changeEvent.target.value)
                    }
                  />

                  <p className="text-muted-foreground mt-1 text-xs">
                    Automatically reads all columns from this sheet.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRefreshColumns}
                  className="text-primary self-start text-xs hover:underline disabled:opacity-50"
                  disabled={isLoadingColumns}
                >
                  {isLoadingColumns ? "Loading..." : "↻ Load sheet columns"}
                </button>
              </>
            )}

            {/* Read node: pick which columns to read */}
            {isSheetReadNode && (
              <>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    Columns to Read
                  </label>

                  <MultiSelect
                    options={availableColumns}
                    value={selectedReadColumns}
                    onChange={(next) => updateConfigValue("readColumns", next)}
                    placeholder="All columns (default)"
                  />

                  <p className="text-muted-foreground mt-1 text-xs">
                    Leave blank to read all columns.
                  </p>
                </div>

                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    Max Rows
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
                    Find Row by Column (optional)
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
                      <SelectValue placeholder="— not needed (use row from Read) —" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="_none">
                        — not needed (use row from Read) —
                      </SelectItem>

                      {availableColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <p className="text-muted-foreground mt-1 text-xs">
                    Use this for WA replies: find the row whose column matches
                    the value below (e.g. Number column = {"{{sender}}"}).
                  </p>
                </div>

                {String(node.data.config.matchColumn ?? "") && (
                  <div>
                    <label className="text-muted-foreground mb-1 block text-xs font-medium">
                      Value to Match
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
                    Condition
                  </label>

                  {sheetSources.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRefreshColumns}
                      className="text-primary text-xs hover:underline disabled:opacity-50"
                      disabled={isLoadingColumns}
                    >
                      {isLoadingColumns ? "Loading..." : "↻ Load sheet columns"}
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
                    Columns are not available yet. Make sure the Google Sheets
                    node has a Credential + Spreadsheet ID, then click
                    &quot;Load sheet columns&quot;.
                  </p>
                )}

                <p className="text-muted-foreground mt-1.5 text-xs">
                  {node.data.kind === "filter"
                    ? "Only rows that pass the condition are forwarded to the next node."
                    : "The flow continues to the next node only if a matching row exists."}
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
                      <SelectValue placeholder="\u2014 select \u2014" />
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
                        <SelectValue placeholder="— select column —" />
                      </SelectTrigger>

                      <SelectContent>
                        {availableColumns.length === 0 ? (
                          <SelectItem value="_none" disabled>
                            No columns yet — click ↻ Load
                          </SelectItem>
                        ) : (
                          <>
                            {sheetColumns.length > 0 && (
                              <SelectGroup>
                                <SelectLabel>Spreadsheet Columns</SelectLabel>

                                {sheetColumns.map((column) => (
                                  <SelectItem key={column} value={column}>
                                    {column}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )}

                            <SelectGroup>
                              <SelectLabel>
                                Fields from Incoming Chat
                              </SelectLabel>

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
                      <SimpleTooltip label="Reload columns from spreadsheet">
                        <button
                          type="button"
                          onClick={handleRefreshColumns}
                          className="text-primary shrink-0 text-sm hover:underline disabled:opacity-50"
                          disabled={isLoadingColumns}
                        >
                          ↻
                        </button>
                      </SimpleTooltip>
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

                    <SimpleTooltip label="Preview spreadsheet data">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        type="button"
                        disabled={
                          !node.data.config[configField.key] ||
                          !node.data.credentialId
                        }
                        onClick={handlePreviewData}
                      >
                        <TableIcon className="size-4" />
                      </Button>
                    </SimpleTooltip>
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
                  Needs fixing
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
                  {isTestRunning ? "Running…" : "Run Test"}
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
                Runs only this node with sample data. Connector nodes still call
                their actual API.
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
              Delete Node
            </Button>
          </div>
        </ScrollArea>
      </aside>
      <SpreadsheetPreviewDrawer />
    </>
  );
}
