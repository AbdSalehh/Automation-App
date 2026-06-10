"use client";

import { useEffect } from "react";
import { XIcon, Trash2Icon, TableIcon } from "lucide-react";
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
} from "@/shared/ui";
import {
  useWorkflowStore,
  useSheetColumnsStore,
  useSheetPreviewStore,
  getNodeTypeDef,
  type FlowNode,
  type ConditionGroup,
} from "@/entities/workflow";
import { useCredentialStore } from "@/entities/credential";
import { ConditionBuilder } from "./ConditionBuilder";
import { SheetWriteTargets, type WriteTarget } from "./SheetWriteTargets";
import { SpreadsheetPreviewDrawer } from "./SpreadsheetPreviewDrawer";

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
  hint?: string;
}

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
      hint: "Nomor diambil dari kolom ini pada tiap baris.",
    },
    {
      key: "to",
      label: "Atau Nomor Manual / Template",
      placeholder: "628xxx atau {{Nomor}}",
    },
    {
      key: "text",
      label: "Pesan",
      multiline: true,
      placeholder: "Halo {{Nama}}, tagihan {{Pesanan}} belum dibayar.",
    },
  ],
  whatsapp_fonnte_send: [
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
      hint: "Jika diisi, pesan dijadwalkan setelah N menit. Saat jatuh tempo, data dicek ulang — jika kondisi sudah tidak terpenuhi (mis. sudah bayar), pengiriman dibatalkan otomatis. Butuh trigger polling/scheduler aktif.",
    },
  ],
  whatsapp_fonnte_trigger: [
    {
      key: "senderField",
      label: "Info",
      placeholder: "",
      hint: "Saat ada balasan WA, data tersedia sebagai {{sender}}, {{message}}, {{name}}. Pasang URL webhook /api/webhooks/whatsapp di dashboard Fonnte → Device → Webhook.",
    },
  ],
  whatsapp_whapi_send: [
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
    {
      key: "reminderDelayMinutes",
      label: "Tunda Kirim (menit)",
      placeholder: "0 = kirim langsung",
      hint: "Jika diisi, pesan dijadwalkan setelah N menit. Saat jatuh tempo, data dicek ulang — jika kondisi sudah tidak terpenuhi (mis. sudah bayar), pengiriman dibatalkan otomatis. Butuh trigger polling/scheduler aktif.",
    },
  ],
  whatsapp_whapi_trigger: [
    {
      key: "senderField",
      label: "Info",
      placeholder: "",
      hint: "Saat ada balasan WA, data tersedia sebagai {{sender}}, {{message}}, {{name}}. Pasang URL webhook /api/webhooks/whapi di panel.whapi.cloud → Channel → Webhooks.",
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
  schedule_trigger: [
    { key: "cron", label: "Cron Expression", placeholder: "0 9 * * *" },
  ],
  function: [{ key: "code", label: "Kode JavaScript", multiline: true }],
};

const CONDITION_NODE_KINDS = new Set(["condition", "filter"]);

const EMPTY_CONDITION_GROUP: ConditionGroup = { match: "all", rules: [] };

export function NodeConfigPanel({ node, onClose }: NodeConfigPanelProps) {
  const { updateNodeData, removeNode, getSheetSources } = useWorkflowStore();

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
  const usesConditionBuilder = CONDITION_NODE_KINDS.has(node.data.kind);
  const isSheetReadNode = node.data.kind === "google_sheets_read";
  const isSheetUpdateNode = node.data.kind === "google_sheets_update";

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
    if (nodeTypeDefinition?.credentialType && credentials.length === 0) {
      fetchCredentials();
    }
  }, [
    nodeTypeDefinition?.credentialType,
    credentials.length,
    fetchCredentials,
  ]);

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

  const updateConditions = (nextGroup: ConditionGroup) =>
    updateNodeData(node.id, {
      config: { ...node.data.config, conditions: nextGroup },
    });

  const credentialOptions = nodeTypeDefinition?.credentialType
    ? credentialsByType(nodeTypeDefinition.credentialType)
    : [];

  const currentConditions =
    (node.data.config.conditions as ConditionGroup | undefined) ??
    EMPTY_CONDITION_GROUP;

  const selectedReadColumns = Array.isArray(node.data.config.readColumns)
    ? (node.data.config.readColumns as string[])
    : [];

  return (
    <>
      <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
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

          {nodeTypeDefinition?.credentialType && (
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
                  Belum ada kredensial untuk konektor ini. Tambahkan di halaman
                  Credentials.
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
                      !node.data.config.spreadsheetId || !node.data.credentialId
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
                  value={String(node.data.config.matchColumn ?? "") || "_none"}
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
                      updateConfigValue("matchValue", changeEvent.target.value)
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

              <ConditionBuilder
                value={currentConditions}
                availableColumns={availableColumns}
                getColumnValues={lookupColumnValues}
                onChange={updateConditions}
              />

              {availableColumns.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-600">
                  Kolom belum tersedia. Pastikan node Google Sheets sudah punya
                  Kredensial + Spreadsheet ID, lalu klik &quot;Muat kolom
                  sheet&quot;.
                </p>
              )}

              <p className="mt-1.5 text-xs text-muted-foreground">
                {node.data.kind === "filter"
                  ? "Hanya baris yang lolos kondisi yang diteruskan ke node berikutnya."
                  : "Flow lanjut ke node berikutnya hanya jika ada baris yang cocok."}
              </p>
            </div>
          )}

          {configFields.map((configField) => (
            <div key={configField.key}>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {configField.label}
              </label>

              {configField.columnSelect ? (
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
                    updateConfigValue(configField.key, changeEvent.target.value)
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
                    updateConfigValue(configField.key, changeEvent.target.value)
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
      </aside>
      <SpreadsheetPreviewDrawer />
    </>
  );
}
