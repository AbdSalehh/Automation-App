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
  SelectItem,
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
  validateNodeData,
  type FlowNode,
  type ConditionGroup,
} from "@/entities/workflow";
import { useCredentialStore } from "@/entities/credential";
import { ConditionBuilder } from "./ConditionBuilder";
import { SheetWriteTargets, type WriteTarget } from "./SheetWriteTargets";
import { SpreadsheetPreviewDrawer } from "./SpreadsheetPreviewDrawer";
import { DateCalculatorConfig } from "./DateCalculatorConfig";
import { ScheduleTriggerConfig } from "./ScheduleTriggerConfig";
import { TransformConfig, type TransformMapping } from "./TransformConfig";
import { ExpressionInput } from "./ExpressionInput";
import type { VariableGroup } from "./VariablePicker";
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
      hint: "Saat ada balasan WA, data tersedia sebagai {{sender}}, {{message}}, {{name}}. Pasang URL webhook /api/webhooks/whapi (Whapi) atau /api/webhooks/whatsapp (Fonnte) di dashboard provider.",
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
  google_calendar_create_event: [
    { key: "summary", label: "Judul Event", placeholder: "Rapat {{Nama}}" },
    {
      key: "startDateTime",
      label: "Mulai (ISO)",
      placeholder: "2026-06-10T09:00:00",
    },
    {
      key: "endDateTime",
      label: "Selesai (ISO)",
      placeholder: "2026-06-10T10:00:00",
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
};

const CONDITION_NODE_KINDS = new Set(["condition", "filter"]);

/**
 * Maps the chosen WhatsApp provider to the credential type it requires.
 * `baileys` sengaja tidak dipetakan karena memakai konfigurasi env (URL service
 * + API key), bukan kredensial per-user, sehingga pemilih kredensial tidak
 * ditampilkan untuk provider tersebut.
 */
const PROVIDER_TO_CREDENTIAL_TYPE = {
  whapi: "whatsapp_whapi",
  fonnte: "whatsapp_fonnte",
  meta: "whatsapp",
} as const;

const WHATSAPP_PROVIDER_OPTIONS = [
  { value: "whapi", label: "Whapi" },
  { value: "fonnte", label: "Fonnte" },
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

  const availableColumns = Array.from(
    new Set([
      ...COMMON_TRIGGER_FIELDS,
      ...sheetSources.flatMap(
        (source) => dataBySpreadsheet[source.spreadsheetId]?.headers ?? [],
      ),
    ]),
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
      <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
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

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-4 p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Label
              </label>

              <Input
                value={node.data.label}
                onChange={(changeEvent) =>
                  updateNodeData(node.id, { label: changeEvent.target.value })
                }
              />

              <p className="mt-1.5 text-xs text-muted-foreground">
                {nodeTypeDefinition?.description}
              </p>
            </div>

            {isWhatsAppSend && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
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

            {effectiveCredentialType && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
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
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
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
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Nama Sheet
                  </label>

                  <Input
                    value={String(node.data.config.sheetName ?? "")}
                    placeholder="Sheet1"
                    onChange={(changeEvent) =>
                      updateConfigValue("sheetName", changeEvent.target.value)
                    }
                  />

                  <p className="mt-1 text-xs text-muted-foreground">
                    Membaca seluruh kolom otomatis dari sheet ini.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRefreshColumns}
                  className="self-start text-xs text-primary hover:underline disabled:opacity-50"
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
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Kolom yang Dibaca
                  </label>

                  <MultiSelect
                    options={availableColumns}
                    value={selectedReadColumns}
                    onChange={(next) => updateConfigValue("readColumns", next)}
                    placeholder="Semua kolom (default)"
                  />

                  <p className="mt-1 text-xs text-muted-foreground">
                    Kosongkan untuk membaca semua kolom.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
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
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
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

                  <p className="mt-1 text-xs text-muted-foreground">
                    Gunakan ini untuk balasan WA: cari baris yang kolomnya cocok
                    dengan nilai di bawah (mis. kolom Nomor = {"{{sender}}"}).
                  </p>
                </div>

                {String(node.data.config.matchColumn ?? "") && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
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
                  <label className="block text-xs font-medium text-muted-foreground">
                    Kondisi
                  </label>

                  {sheetSources.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRefreshColumns}
                      className="text-xs text-primary hover:underline disabled:opacity-50"
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

                <p className="mt-1.5 text-xs text-muted-foreground">
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
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {configField.label}
                </label>

                {configField.selectOptions ? (
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
                          availableColumns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    {sheetSources.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRefreshColumns}
                        className="shrink-0 text-sm text-primary hover:underline disabled:opacity-50"
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
                  <p className="mt-1 text-xs text-muted-foreground">
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
            <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
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
                  <pre className="whitespace-pre-wrap break-all">
                    {testResult.ok
                      ? JSON.stringify(testResult.output, null, 2)
                      : testResult.error}
                  </pre>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground">
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
