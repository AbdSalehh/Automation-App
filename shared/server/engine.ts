import { prisma } from "@/shared/lib/prisma";
import { decryptJson } from "@/shared/lib/crypto";
import { requestExternal } from "@/shared/server/httpClient";
import {
  resolveTemplate,
  evaluateConditionGroup,
  type ConditionGroup,
} from "@/shared/server/templating";
import {
  resolveExpression,
  evaluateBooleanExpression,
} from "@/shared/lib/expression";
import { getGoogleAccessToken } from "@/shared/server/google";
import {
  upsertReminder,
  clearReminder,
  listReminderKeys,
} from "@/shared/server/reminders";
import type {
  FlowNode,
  FlowEdge,
} from "@/entities/workflow/model/workflow.model";
import type {
  NodeKind,
  WhatsAppProvider,
} from "@/entities/workflow/model/node.model";

/**
 * In-process, item-aware workflow execution engine.
 *
 * Data flows between nodes as an array of "items" (rows). Source nodes such as
 * Google Sheets Read emit one item per row; action nodes such as WhatsApp Send
 * run once per item, resolving `{{column}}` templates against that row. This
 * mirrors n8n's per-item execution model and makes Sheet → Condition →
 * WhatsApp → Update Sheet flows fully dynamic.
 *
 * Server-only module.
 */

interface RunContext {
  executionId: string;
  ownerId: string;
  /** The workflow being executed — used to scope per-row reminders. */
  workflowId: string;
  /** Optional payload that seeds trigger nodes (webhook body, etc.). */
  triggerPayload?: unknown;
}

/** Normalised flowing value: always an array of row objects. */
type Item = Record<string, unknown>;

/**
 * Converts a zero-based column index to a spreadsheet column letter.
 * 0 -> A, 25 -> Z, 26 -> AA, etc.
 */
function indexToColumnLetter(index: number): string {
  let result = "";
  let current = index;

  while (current >= 0) {
    result = String.fromCharCode((current % 26) + 65) + result;
    current = Math.floor(current / 26) - 1;
  }

  return result;
}

async function writeLog(
  executionId: string,
  level: "info" | "warn" | "error",
  message: string,
): Promise<void> {
  await prisma.log.create({ data: { executionId, level, message } });
}

async function loadCredential(
  credentialId: string | undefined,
  ownerId: string,
): Promise<Record<string, string> | null> {
  if (!credentialId) {
    return null;
  }

  const credentialRecord = await prisma.credential.findFirst({
    where: { id: credentialId, userId: ownerId },
  });

  if (!credentialRecord) {
    return null;
  }

  return decryptJson<Record<string, string>>(credentialRecord.data);
}

/**
 * Coerces an arbitrary node output into an array of items so downstream nodes
 * can iterate uniformly. Recognises common shapes: `{ rows: [...] }`,
 * `{ items: [...] }`, a raw array, or a single object.
 */
function toItems(value: unknown): Item[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((entry) =>
      entry && typeof entry === "object" ? (entry as Item) : { value: entry },
    );
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (Array.isArray(record.rows)) {
      return record.rows as Item[];
    }

    if (Array.isArray(record.items)) {
      return record.items as Item[];
    }

    return [record];
  }

  return [{ value }];
}

/**
 * Resolves the input into items for an action node, distinguishing a
 * "collection" (explicit rows/items/array from an upstream Read or Filter)
 * from a single ad-hoc payload.
 *
 * - When the upstream produced a collection (even an empty one), we respect it:
 *   an empty collection means "no rows to act on" and the node should no-op
 *   instead of falling back to a manual single send.
 * - When there's no collection context, we return a single empty item so a
 *   manually-configured node (e.g. fixed number + message) can still run once.
 */
function resolveActionItems(value: unknown): {
  items: Item[];
  isCollection: boolean;
} {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;

    if (Array.isArray(record.rows) || Array.isArray(record.items)) {
      return { items: toItems(value), isCollection: true };
    }
  }

  if (Array.isArray(value)) {
    return { items: toItems(value), isCollection: true };
  }

  const items = toItems(value);

  return {
    items: items.length > 0 ? items : [{}],
    isCollection: false,
  };
}

// ---------------------------------------------------------------------------
// Connector senders (one message per item)
// ---------------------------------------------------------------------------

async function sendFonnte(
  credential: Record<string, string>,
  target: string,
  message: string,
  countryCode: string,
): Promise<Record<string, unknown>> {
  const response = await requestExternal("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: credential.apiKey,
      "Content-Type": "application/json",
    },
    data: { target, message, countryCode },
  });

  if (!response.ok) {
    throw new Error(
      `WhatsApp Fonnte: gagal mengirim ke ${target} (status ${response.status})`,
    );
  }

  const body = response.body as {
    status?: boolean;
    reason?: string;
    id?: unknown;
  };

  if (body.status === false) {
    throw new Error(
      `WhatsApp Fonnte: ${body.reason ?? "gagal mengirim pesan"}`,
    );
  }

  // Fonnte returns a message id array; expose it for downstream tracking.
  const messageId = Array.isArray(body.id) ? body.id[0] : (body.id ?? null);

  return { provider: "fonnte", messageId, raw: body };
}

async function sendWhapi(
  credential: Record<string, string>,
  target: string,
  message: string,
): Promise<Record<string, unknown>> {
  // Whapi expects the recipient in international format without symbols, or a
  // full chat id (e.g. 628xxx@s.whatsapp.net). Strip non-digits unless a chat
  // id was already provided.
  const to = target.includes("@") ? target : target.replace(/\D/g, "");

  const response = await requestExternal(
    "https://gate.whapi.cloud/messages/text",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credential.apiToken}`,
        "Content-Type": "application/json",
      },
      data: { to, body: message },
    },
  );

  if (!response.ok) {
    throw new Error(
      `WhatsApp Whapi: gagal mengirim ke ${target} (status ${response.status})`,
    );
  }

  const body = response.body as {
    sent?: boolean;
    message?: { id?: string };
    error?: { message?: string };
  };

  if (body.error) {
    throw new Error(
      `WhatsApp Whapi: ${body.error.message ?? "gagal mengirim pesan"}`,
    );
  }

  const messageId = body.message?.id ?? null;

  return { provider: "whapi", messageId, raw: body };
}

/**
 * Sends a WhatsApp message via the Meta WhatsApp Business Cloud API.
 */
async function sendMeta(
  credential: Record<string, string>,
  target: string,
  message: string,
): Promise<Record<string, unknown>> {
  const to = target.replace(/\D/g, "");

  const response = await requestExternal(
    `https://graph.facebook.com/v20.0/${credential.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credential.accessToken}`,
        "Content-Type": "application/json",
      },
      data: {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `WhatsApp Meta: gagal mengirim ke ${target} (status ${response.status})`,
    );
  }

  return { provider: "meta", messageId: null, raw: response.body };
}

/**
 * Provider dispatcher used by the unified `whatsapp_send` node. Routes the send
 * to Whapi, Fonnte, or Meta based on the selected provider.
 */
async function sendWhatsApp(
  provider: WhatsAppProvider,
  credential: Record<string, string>,
  target: string,
  message: string,
  countryCode: string,
): Promise<Record<string, unknown>> {
  if (provider === "fonnte") {
    return sendFonnte(credential, target, message, countryCode);
  }

  if (provider === "meta") {
    return sendMeta(credential, target, message);
  }

  return sendWhapi(credential, target, message);
}

/**
 * Validates that the selected provider has the credential fields it needs.
 */
function assertWhatsAppCredential(
  provider: WhatsAppProvider,
  credential: Record<string, string> | null,
): asserts credential is Record<string, string> {
  if (provider === "fonnte" && !credential?.apiKey) {
    throw new Error("WhatsApp Fonnte: API key tidak ada");
  }

  if (provider === "whapi" && !credential?.apiToken) {
    throw new Error("WhatsApp Whapi: API token tidak ada");
  }

  if (
    provider === "meta" &&
    (!credential?.accessToken || !credential?.phoneNumberId)
  ) {
    throw new Error("WhatsApp Meta: kredensial tidak lengkap");
  }
}

// ---------------------------------------------------------------------------
// Node executor
// ---------------------------------------------------------------------------

/** Executes a single node and returns its output. */
async function runNode(
  node: FlowNode,
  input: unknown,
  context: RunContext,
): Promise<unknown> {
  const nodeKind = node.data.kind as NodeKind;
  const config = node.data.config ?? {};

  switch (nodeKind) {
    case "manual_trigger":
    case "schedule_trigger":
    case "google_sheets_trigger":
    case "google_calendar_trigger":
      return (
        context.triggerPayload ?? {
          triggered: true,
          at: new Date().toISOString(),
        }
      );

    case "webhook_trigger":
      // Webhook payloads seed the flow as items.
      return (
        context.triggerPayload ?? {
          triggered: true,
          at: new Date().toISOString(),
        }
      );

    case "whatsapp_trigger": {
      /**
       * Incoming WhatsApp reply. The provider webhook seeds triggerPayload with
       * { sender, message, ... }. Expose it as a single-item collection so
       * downstream condition/update nodes can use {{sender}}, {{message}}.
       */
      const payload = (context.triggerPayload ?? {}) as Record<string, unknown>;

      return { rows: [payload], ...payload };
    }

    case "http_request": {
      const requestUrl = resolveTemplate(
        String(config.url ?? ""),
        (input as Item) ?? {},
      );
      const requestMethod = String(config.method ?? "GET").toUpperCase();

      if (!requestUrl) {
        throw new Error("HTTP Request: url kosong");
      }

      const isBodyless = requestMethod === "GET" || requestMethod === "HEAD";

      const response = await requestExternal(requestUrl, {
        method: requestMethod,
        headers: { "Content-Type": "application/json" },
        data: isBodyless ? undefined : (config.body ?? input ?? {}),
      });

      return { status: response.status, body: response.body };
    }

    case "telegram_send": {
      const credential = await loadCredential(
        node.data.credentialId,
        context.ownerId,
      );

      if (!credential?.botToken) {
        throw new Error("Telegram: kredensial tidak ada");
      }

      const items = toItems(input);
      const results: unknown[] = [];

      const itemsToSend = items.length > 0 ? items : [{}];

      for (const item of itemsToSend) {
        const text = resolveTemplate(String(config.text ?? ""), item);
        const chatId = resolveTemplate(String(config.chatId ?? ""), item);

        const response = await requestExternal(
          `https://api.telegram.org/bot${credential.botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { chat_id: chatId, text },
          },
        );

        if (!response.ok) {
          throw new Error("Telegram: gagal mengirim pesan");
        }

        results.push(response.body);
      }

      return { sent: results.length, results };
    }

    case "whatsapp_send": {
      const provider = String(config.provider ?? "whapi") as WhatsAppProvider;

      const credential = await loadCredential(
        node.data.credentialId,
        context.ownerId,
      );

      assertWhatsAppCredential(provider, credential);

      const { items, isCollection } = resolveActionItems(input);
      const countryCode = String(config.countryCode ?? "62");
      const targetField = String(config.targetField ?? "").trim();
      const messageTemplate = String(config.message ?? config.text ?? "");

      /** If an upstream collection is empty, there's nothing to send. */
      if (isCollection && items.length === 0) {
        return { sent: 0, results: [], rows: [] };
      }

      const resolveTarget = (item: Item): string =>
        resolveTemplate(String(config.target ?? config.to ?? ""), item) ||
        (targetField
          ? String(item[targetField] ?? item[targetField + " "] ?? "")
          : "") ||
        String(item.phone ?? item.nomor ?? item.Nomor ?? "");

      /**
       * Delayed reminder mode with auto-cancel.
       *
       * When reminderDelayMinutes > 0, matching rows are not sent immediately.
       * Each row registers a pending reminder (due = now + delay). On a later
       * run we only send rows whose reminder is due. Rows that stopped matching
       * the upstream condition disappear from `items`, so we cancel them.
       */
      const reminderDelayMinutes = Number(config.reminderDelayMinutes ?? 0);
      const reminderScope = `${context.workflowId}:${node.id}`;

      if (reminderDelayMinutes > 0) {
        const now = Date.now();
        const dueOffsetMs = reminderDelayMinutes * 60_000;

        const currentRowKeys = new Set<string>();

        const results: Array<{
          target: string;
          ok: boolean;
          messageId: unknown;
          status: string;
        }> = [];

        const enrichedRows: Item[] = [];

        for (const item of items) {
          const target = resolveTarget(item);

          if (!target) {
            continue;
          }

          const rowKey = String(item.__rowNumber ?? target);
          currentRowKeys.add(rowKey);

          const message = messageTemplate
            ? resolveTemplate(messageTemplate, item)
            : JSON.stringify(item);

          const reminder = await upsertReminder(reminderScope, rowKey, {
            dueAt: now + dueOffsetMs,
            target,
            message,
          });

          /** Redis unavailable -> fall back to immediate send. */
          if (!reminder) {
            const sendResult = await sendWhatsApp(
              provider,
              credential,
              target,
              message,
              countryCode,
            );

            results.push({
              target,
              ok: true,
              messageId: sendResult.messageId,
              status: "sent_immediate",
            });

            enrichedRows.push({
              ...item,
              __waTarget: target,
              __waMessageId: sendResult.messageId,
              __waSentAt: new Date().toISOString(),
            });
            continue;
          }

          if (now >= reminder.dueAt) {
            const sendResult = await sendWhatsApp(
              provider,
              credential,
              target,
              reminder.message,
              countryCode,
            );

            await clearReminder(reminderScope, rowKey);

            results.push({
              target,
              ok: true,
              messageId: sendResult.messageId,
              status: "sent",
            });

            enrichedRows.push({
              ...item,
              __waTarget: target,
              __waMessageId: sendResult.messageId,
              __waSentAt: new Date().toISOString(),
            });
          } else {
            const minutesLeft = Math.ceil((reminder.dueAt - now) / 60_000);

            results.push({
              target,
              ok: true,
              messageId: null,
              status: `pending_${minutesLeft}m`,
            });
          }
        }

        const pendingKeys = await listReminderKeys(reminderScope);
        let cancelled = 0;

        for (const pendingKey of pendingKeys) {
          if (!currentRowKeys.has(pendingKey)) {
            await clearReminder(reminderScope, pendingKey);
            cancelled += 1;
          }
        }

        const sentCount = results.filter(
          (result) =>
            result.status === "sent" || result.status === "sent_immediate",
        ).length;

        return {
          sent: sentCount,
          pending: results.filter((result) =>
            result.status.startsWith("pending"),
          ).length,
          cancelled,
          results,
          rows: enrichedRows,
        };
      }

      /** Immediate send mode (default). */
      const results: Array<{
        target: string;
        ok: boolean;
        messageId: unknown;
      }> = [];

      const enrichedRows: Item[] = [];

      for (const item of items) {
        const target = resolveTarget(item);

        if (!target) {
          results.push({
            target: "(tidak ada nomor)",
            ok: false,
            messageId: null,
          });
          continue;
        }

        const message = messageTemplate
          ? resolveTemplate(messageTemplate, item)
          : JSON.stringify(item);

        const sendResult = await sendWhatsApp(
          provider,
          credential,
          target,
          message,
          countryCode,
        );

        results.push({
          target,
          ok: true,
          messageId: sendResult.messageId,
        });

        enrichedRows.push({
          ...item,
          __waTarget: target,
          __waMessageId: sendResult.messageId,
          __waSentAt: new Date().toISOString(),
        });
      }

      return { sent: results.length, results, rows: enrichedRows };
    }

    case "google_sheets_append": {
      const credential = await loadCredential(
        node.data.credentialId,
        context.ownerId,
      );

      if (!credential) {
        throw new Error("Google Sheets: kredensial tidak ada");
      }

      const accessToken = await getGoogleAccessToken(credential);
      const spreadsheetId = String(config.spreadsheetId ?? "");

      /** Prefer sheetName config; fall back to explicit range; default Sheet1!A1 */
      const sheetName = String(config.sheetName ?? "").trim();
      const range = sheetName
        ? `${sheetName}!A1`
        : String(config.range ?? "Sheet1!A1");

      const items = toItems(input);

      const columnOrder = String(config.columns ?? "")
        .split(",")
        .map((column) => column.trim())
        .filter(Boolean);

      /**
       * Each column entry can be:
       *   - A plain field name (e.g. "message") → extracts item.message
       *   - A {{template}} reference (e.g. "{{message}}") → resolved via template
       *
       * When a field is not found in the item, fall back to empty string
       * instead of the literal column name to avoid writing column headers
       * as data values.
       */
      const values = items.map((item) =>
        columnOrder.length > 0
          ? columnOrder.map((column) => {
              if (column.includes("{{")) {
                return resolveTemplate(column, item);
              }

              return String(item[column] ?? "");
            })
          : Object.values(item).map((cell) =>
              resolveTemplate(String(cell ?? ""), item),
            ),
      );

      const response = await requestExternal(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          data: { values },
        },
      );

      if (!response.ok) {
        throw new Error("Google Sheets: gagal menambahkan baris");
      }

      return { appended: values.length, rows: items };
    }

    case "google_sheets_read": {
      const credential = await loadCredential(
        node.data.credentialId,
        context.ownerId,
      );

      if (!credential) {
        throw new Error("Google Sheets: kredensial tidak ada");
      }

      const accessToken = await getGoogleAccessToken(credential);

      const spreadsheetId = String(config.spreadsheetId ?? "");

      if (!spreadsheetId) {
        throw new Error("Google Sheets: spreadsheetId wajib diisi");
      }

      /**
       * Prefer a sheet name (reads the whole used range incl. every column).
       * Fall back to an explicit A1 range for backward compatibility.
       */
      const sheetName = String(config.sheetName ?? "").trim();
      const readRange = sheetName || String(config.range ?? "Sheet1");

      const sheetsResponse = await requestExternal(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(readRange)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (!sheetsResponse.ok) {
        throw new Error("Google Sheets: gagal membaca data");
      }

      const sheetsBody = sheetsResponse.body as { values?: string[][] };
      const rawRows = sheetsBody.values ?? [];

      if (rawRows.length === 0) {
        return { rows: [], headers: [], totalRows: 0 };
      }

      const headers = rawRows[0].map((header) => String(header).trim());
      const resolvedSheetName = readRange.split("!")[0];

      /** Optional subset of columns to keep (besides metadata). */
      const readColumns = Array.isArray(config.readColumns)
        ? (config.readColumns as string[])
        : [];

      const dataRows = rawRows.slice(1).map((row, rowIndex) => {
        const rowObject: Record<string, string> = {};

        headers.forEach((header, columnIndex) => {
          // When readColumns is set, keep only those; else keep all.
          if (readColumns.length === 0 || readColumns.includes(header)) {
            rowObject[header] = row[columnIndex] ?? "";
          }
        });

        // Attach row metadata so downstream Update nodes can locate the row.
        rowObject.__rowNumber = String(rowIndex + 2); // +2: header + 1-indexed
        rowObject.__sheetName = resolvedSheetName;

        return rowObject;
      });

      const limit = Number(config.limit ?? 100);

      return {
        rows: dataRows.slice(0, limit),
        headers: readColumns.length > 0 ? readColumns : headers,
        totalRows: dataRows.length,
      };
    }

    case "google_sheets_update": {
      const credential = await loadCredential(
        node.data.credentialId,
        context.ownerId,
      );

      if (!credential) {
        throw new Error("Google Sheets: kredensial tidak ada");
      }

      const accessToken = await getGoogleAccessToken(credential);
      const spreadsheetId = String(config.spreadsheetId ?? "");

      if (!spreadsheetId) {
        throw new Error("Google Sheets: spreadsheetId wajib diisi");
      }

      const items = toItems(input);

      if (items.length === 0) {
        return { updated: 0, note: "Tidak ada baris untuk di-update" };
      }

      const fallbackSheetName = String(config.sheetName ?? "Sheet1");

      /**
       * Write targets. New format: writeTargets = [{ column: "Reminder",
       * value: "Sudah Diingatkan {{__waMessageId}}" }] where column is a header
       * name. Legacy format: single targetColumn (letter) + value.
       */
      const writeTargets = Array.isArray(config.writeTargets)
        ? (config.writeTargets as Array<{ column: string; value: string }>)
        : [];

      const legacyColumn = String(config.targetColumn ?? "").trim();
      const legacyValue = String(config.value ?? "");

      if (writeTargets.length === 0 && !legacyColumn) {
        throw new Error(
          "Google Sheets Update: pilih minimal satu kolom untuk ditulis",
        );
      }

      /**
       * Map header name -> column letter by reading the sheet's real header
       * row. This is reliable even when the upstream Read projected a subset of
       * columns.
       */
      const sheetForHeaders = String(items[0].__sheetName ?? fallbackSheetName);

      const headerResponse = await requestExternal(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${sheetForHeaders}!1:1`)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      const headerRow = (
        (headerResponse.body as { values?: string[][] })?.values?.[0] ?? []
      ).map((header) => String(header).trim());

      const columnLetterForHeader = (header: string): string | null => {
        const index = headerRow.indexOf(header.trim());

        if (index < 0) {
          return null;
        }

        return indexToColumnLetter(index);
      };

      /**
       * Lookup mode: when the incoming items don't carry a __rowNumber (e.g.
       * from a WhatsApp reply trigger), locate the target row by matching a
       * column value. Config:
       *   matchColumn  — header to search in (e.g. "Nomor")
       *   matchValue   — value template to find (e.g. "{{sender}}")
       */
      const matchColumn = String(config.matchColumn ?? "").trim();

      const resolveRowNumberByMatch = async (
        item: Item,
      ): Promise<string | null> => {
        const matchLetter = columnLetterForHeader(matchColumn);

        if (!matchLetter) {
          return null;
        }

        const wantedRaw = resolveTemplate(
          String(config.matchValue ?? `{{${matchColumn}}}`),
          item,
        );

        // Normalise phone-ish values (strip non-digits) for robust matching.
        const normalise = (value: string) =>
          value.replace(/\D/g, "") || value.trim();
        const wanted = normalise(wantedRaw);

        const columnResponse = await requestExternal(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${sheetForHeaders}!${matchLetter}:${matchLetter}`)}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        const columnValues = (
          (columnResponse.body as { values?: string[][] })?.values ?? []
        ).map((cell) => String(cell[0] ?? ""));

        // Skip header (index 0). Sheet rows are 1-indexed.
        for (let rowIndex = 1; rowIndex < columnValues.length; rowIndex += 1) {
          if (normalise(columnValues[rowIndex]) === wanted) {
            return String(rowIndex + 1);
          }
        }

        return null;
      };

      const updates: Array<{ range: string; values: string[][] }> = [];

      for (const item of items) {
        let rowNumber = item.__rowNumber as string | undefined;
        const sheetName = String(item.__sheetName ?? fallbackSheetName);

        // No row number but a match column configured -> look it up.
        if (!rowNumber && matchColumn) {
          const found = await resolveRowNumberByMatch(item);

          if (found) {
            rowNumber = found;
          }
        }

        if (!rowNumber) {
          continue;
        }

        if (writeTargets.length > 0) {
          for (const target of writeTargets) {
            const columnLetter = columnLetterForHeader(target.column);

            if (!columnLetter) {
              continue;
            }

            updates.push({
              range: `${sheetName}!${columnLetter}${rowNumber}`,
              values: [[resolveTemplate(target.value, item)]],
            });
          }
        } else {
          updates.push({
            range: `${sheetName}!${legacyColumn}${rowNumber}`,
            values: [[resolveTemplate(legacyValue, item)]],
          });
        }
      }

      if (updates.length === 0) {
        return {
          updated: 0,
          note: "Tidak ada baris untuk di-update (perlu metadata __rowNumber dari node Read)",
        };
      }

      const response = await requestExternal(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          data: {
            valueInputOption: "USER_ENTERED",
            data: updates,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Google Sheets: gagal meng-update baris");
      }

      return { updated: updates.length, rows: items };
    }

    case "google_calendar_list_events": {
      const credential = await loadCredential(
        node.data.credentialId,
        context.ownerId,
      );

      if (!credential) {
        throw new Error("Google Calendar: kredensial tidak ada");
      }

      const accessToken = await getGoogleAccessToken(credential);
      const calendarId = credential.calendarId || "primary";
      const maxResults = Number(config.maxResults ?? 10);
      const timeMin = config.timeMin
        ? String(config.timeMin)
        : new Date().toISOString();

      const eventsResponse = await requestExternal(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=${maxResults}&timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (!eventsResponse.ok) {
        throw new Error("Google Calendar: gagal mengambil daftar event");
      }

      return eventsResponse.body;
    }

    case "google_calendar_create_event": {
      const credential = await loadCredential(
        node.data.credentialId,
        context.ownerId,
      );

      if (!credential) {
        throw new Error("Google Calendar: kredensial tidak ada");
      }

      const accessToken = await getGoogleAccessToken(credential);
      const calendarId = credential.calendarId || "primary";
      const item = (toItems(input)[0] ?? {}) as Item;

      const eventBody = {
        summary: resolveTemplate(String(config.summary ?? ""), item),
        description: config.description
          ? resolveTemplate(String(config.description), item)
          : undefined,
        location: config.location ? String(config.location) : undefined,
        start: {
          dateTime: String(config.startDateTime ?? new Date().toISOString()),
          timeZone: String(config.timeZone ?? "UTC"),
        },
        end: {
          dateTime: String(
            config.endDateTime ?? new Date(Date.now() + 3600000).toISOString(),
          ),
          timeZone: String(config.timeZone ?? "UTC"),
        },
        attendees: config.attendees
          ? (config.attendees as string[]).map((email) => ({ email }))
          : undefined,
      };

      const createResponse = await requestExternal(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          data: eventBody,
        },
      );

      if (!createResponse.ok) {
        throw new Error("Google Calendar: gagal membuat event");
      }

      return createResponse.body;
    }

    case "filter": {
      const conditionGroup = (config.conditions as ConditionGroup) ?? {
        match: "all",
        rules: [],
      };

      const items = toItems(input);
      const matchedRows = items.filter((item) =>
        evaluateConditionGroup(conditionGroup, item),
      );

      return {
        rows: matchedRows,
        headers: Object.keys(items[0] ?? {}),
        totalRows: matchedRows.length,
        filteredOut: items.length - matchedRows.length,
      };
    }

    case "condition": {
      const conditionGroup = config.conditions as ConditionGroup | undefined;
      const items = toItems(input);
      const conditionMode = String(config.mode ?? "visual");
      const customExpression = String(config.expression ?? "").trim();

      /** Code mode: evaluate a JS expression per item against payload context. */
      if (conditionMode === "code" && customExpression) {
        const matchedRows = items.filter((item) =>
          evaluateBooleanExpression(customExpression, {
            payload: item,
            $workflow: { id: context.workflowId },
            $execution: { id: context.executionId },
          }),
        );

        return {
          condition: matchedRows.length > 0,
          rows: matchedRows,
          totalRows: matchedRows.length,
        };
      }

      // Structured condition (preferred): keep matching rows.
      if (conditionGroup && Array.isArray(conditionGroup.rules)) {
        const matchedRows = items.filter((item) =>
          evaluateConditionGroup(conditionGroup, item),
        );

        return {
          condition: matchedRows.length > 0,
          rows: matchedRows,
          totalRows: matchedRows.length,
        };
      }

      // Fallback: legacy JS expression evaluated against the first item.
      const expression = String(config.expression ?? "true");
      let conditionResult = false;

      try {
        // eslint-disable-next-line no-new-func
        const evaluate = Function(
          "input",
          `"use strict"; return (${expression});`,
        );
        conditionResult = Boolean(evaluate(input));
      } catch {
        conditionResult = false;
      }

      return { condition: conditionResult, rows: items };
    }

    case "function": {
      const userCode = String(config.code ?? "return input;");

      // eslint-disable-next-line no-new-func
      const runUserCode = Function("input", `"use strict"; ${userCode}`);

      return runUserCode(input);
    }

    case "transform": {
      const items = toItems(input);
      const transformMode = String(config.mode ?? "keyvalue");

      const expressionContext = (item: Item) => ({
        payload: item,
        $workflow: { id: context.workflowId },
        $execution: { id: context.executionId },
      });

      /** Code mode: run a JS transform returning a new object per item. */
      if (transformMode === "code") {
        const userCode = String(config.code ?? "return payload;");

        const transformedRows = items.map((item) => {
          try {
            // eslint-disable-next-line no-new-func
            const runTransform = Function(
              "payload",
              "$now",
              `"use strict"; ${userCode}`,
            );

            return (runTransform(item, new Date()) ?? {}) as Item;
          } catch {
            return item;
          }
        });

        return {
          rows: transformedRows,
          result: transformedRows[0] ?? {},
          totalRows: transformedRows.length,
        };
      }

      /** Key/value mode: map each output field via a {{ }} template. */
      const mappings = Array.isArray(config.mappings)
        ? (config.mappings as { key: string; value: string }[])
        : [];

      const transformedRows = items.map((item) => {
        const mapped: Record<string, unknown> = {};

        for (const mapping of mappings) {
          if (!mapping.key) {
            continue;
          }

          mapped[mapping.key] = resolveExpression(
            mapping.value ?? "",
            expressionContext(item),
          );
        }

        return mapped as Item;
      });

      return {
        rows: transformedRows,
        result: transformedRows[0] ?? {},
        totalRows: transformedRows.length,
      };
    }

    case "date_calculator": {
      const items = toItems(input);

      const mode = String(config.mode ?? "relative");
      const operation = String(config.operation ?? "subtract");
      const dateField = String(config.dateField ?? "").trim();
      const time = String(config.time ?? "").trim();
      const absoluteDate = String(config.absoluteDate ?? "").trim();

      /** Offset units; falls back to the legacy `days` field when present. */
      const offsets = (config.offsets as Record<string, unknown>) ?? {};
      const offsetMinutes = Number(offsets.minutes ?? 0);
      const offsetHours = Number(offsets.hours ?? 0);
      const offsetDays = Number(offsets.days ?? config.days ?? 0);
      const offsetMonths = Number(offsets.months ?? 0);
      const offsetYears = Number(offsets.years ?? 0);

      const applyTimeOverride = (targetDate: Date) => {
        if (time && /^\d{1,2}:\d{2}$/.test(time)) {
          const [hours, minutes] = time.split(":").map(Number);
          targetDate.setHours(hours, minutes, 0, 0);
        }
      };

      const enrichedRows = items.map((item) => {
        let computedDate = "";

        if (mode === "absolute") {
          const fixedDate = absoluteDate ? new Date(absoluteDate) : new Date();

          if (!Number.isNaN(fixedDate.getTime())) {
            applyTimeOverride(fixedDate);
            computedDate = fixedDate.toISOString();
          }

          return { ...item, computedDate };
        }

        const baseRaw = dateField ? String(item[dateField] ?? "") : "";
        const baseDate = baseRaw ? new Date(baseRaw) : new Date();

        if (!Number.isNaN(baseDate.getTime())) {
          const sign = operation === "add" ? 1 : -1;

          baseDate.setFullYear(baseDate.getFullYear() + sign * offsetYears);
          baseDate.setMonth(baseDate.getMonth() + sign * offsetMonths);
          baseDate.setDate(baseDate.getDate() + sign * offsetDays);
          baseDate.setHours(baseDate.getHours() + sign * offsetHours);
          baseDate.setMinutes(baseDate.getMinutes() + sign * offsetMinutes);

          applyTimeOverride(baseDate);

          computedDate = baseDate.toISOString();
        }

        return { ...item, computedDate };
      });

      return {
        rows: enrichedRows,
        computedDate: enrichedRows[0]?.computedDate ?? "",
        totalRows: enrichedRows.length,
      };
    }

    case "schedule": {
      const items = toItems(input);
      const firstItem = items[0] ?? {};

      const dateField = String(config.dateField ?? "computedDate").trim();
      const explicitDate = String(config.executeDate ?? "").trim();
      const time = String(config.time ?? "").trim();

      const targetRaw = explicitDate
        ? resolveTemplate(explicitDate, firstItem)
        : String(firstItem[dateField] ?? "");

      const dueDate = targetRaw ? new Date(targetRaw) : null;

      if (dueDate && time && /^\d{1,2}:\d{2}$/.test(time)) {
        const [hours, minutes] = time.split(":").map(Number);
        dueDate.setHours(hours, minutes, 0, 0);
      }

      const dueAt =
        dueDate && !Number.isNaN(dueDate.getTime())
          ? dueDate.getTime()
          : Date.now();

      /** Future due time -> pause the workflow until the scheduler resumes it. */
      if (dueAt > Date.now()) {
        return { __pause: "schedule", dueAt, rows: items };
      }

      return { rows: items, scheduledAt: new Date(dueAt).toISOString() };
    }

    case "wait_reply": {
      const items = toItems(input);
      const firstItem = items[0] ?? {};

      const matchField = String(config.matchField ?? "").trim();

      const matchKey =
        resolveTemplate(String(config.matchValue ?? ""), firstItem) ||
        (matchField ? String(firstItem[matchField] ?? "") : "") ||
        String(
          firstItem.__waTarget ??
            firstItem.phone ??
            firstItem.Nomor ??
            firstItem.nomor ??
            "",
        );

      return { __pause: "wait_reply", matchKey, rows: items };
    }

    default:
      return input;
  }
}

/** Orders nodes starting from triggers following edges (BFS). */
function orderNodes(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const incomingCount = new Map<string, number>();

  nodes.forEach((node) => incomingCount.set(node.id, 0));
  edges.forEach((edge) =>
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1),
  );

  const pendingQueue = nodes
    .filter(
      (node) =>
        (incomingCount.get(node.id) ?? 0) === 0 ||
        node.data.kind.endsWith("_trigger"),
    )
    .map((node) => node.id);

  const orderedNodes: FlowNode[] = [];
  const visitedIds = new Set<string>();

  while (pendingQueue.length > 0) {
    const currentId = pendingQueue.shift()!;

    if (visitedIds.has(currentId)) {
      continue;
    }

    visitedIds.add(currentId);

    const currentNode = nodesById.get(currentId);

    if (currentNode) {
      orderedNodes.push(currentNode);
    }

    edges
      .filter((edge) => edge.source === currentId)
      .forEach((edge) => {
        if (!visitedIds.has(edge.target)) {
          pendingQueue.push(edge.target);
        }
      });
  }

  nodes.forEach((node) => {
    if (!visitedIds.has(node.id)) {
      orderedNodes.push(node);
    }
  });

  return orderedNodes;
}

interface ExecOutcome {
  status: "success" | "failed" | "paused";
  lastOutput: unknown;
}

/**
 * Executes ordered nodes starting from a cursor, seeding prior outputs. Detects
 * the `__pause` sentinel returned by `schedule` / `wait_reply` nodes: when hit,
 * it serialises the engine state into a `WaitingExecution` row, marks the
 * execution as "waiting", and returns early so the workflow can resume later.
 */
async function executeNodes(
  orderedNodes: FlowNode[],
  edges: FlowEdge[],
  context: RunContext,
  startCursor: number,
  outputByNodeId: Map<string, unknown>,
  seedLastOutput: unknown,
): Promise<ExecOutcome> {
  let lastOutput: unknown = seedLastOutput;
  let hasFailed = false;

  for (
    let cursorIndex = startCursor;
    cursorIndex < orderedNodes.length;
    cursorIndex += 1
  ) {
    const node = orderedNodes[cursorIndex];

    /** Resolve this node's input: prefer the output of its direct predecessor. */
    const incomingEdge = edges.find((edge) => edge.target === node.id);
    const nodeInput = incomingEdge
      ? (outputByNodeId.get(incomingEdge.source) ?? lastOutput)
      : lastOutput;

    try {
      const output = await runNode(node, nodeInput, context);

      /** Pause sentinel -> persist state and stop until resumed. */
      if (
        output &&
        typeof output === "object" &&
        "__pause" in (output as Record<string, unknown>)
      ) {
        const pause = output as {
          __pause: string;
          dueAt?: number;
          matchKey?: string;
        };

        outputByNodeId.set(node.id, output);

        const serializedState = JSON.stringify({
          outputs: Object.fromEntries(outputByNodeId),
          cursorIndex,
        });

        await prisma.waitingExecution.create({
          data: {
            executionId: context.executionId,
            workflowId: context.workflowId,
            nodeId: node.id,
            pauseType: pause.__pause,
            matchKey: pause.matchKey ?? null,
            dueAt: pause.dueAt ? BigInt(pause.dueAt) : null,
            state: serializedState,
          },
        });

        await prisma.execution.update({
          where: { id: context.executionId },
          data: { status: "waiting" },
        });

        await writeLog(
          context.executionId,
          "info",
          `Node "${node.data.label}": eksekusi dijeda (${pause.__pause})`,
        );

        return { status: "paused", lastOutput };
      }

      outputByNodeId.set(node.id, output);
      lastOutput = output;

      /** Stop traversal down a branch when a condition node evaluates false. */
      if (
        node.data.kind === "condition" &&
        output &&
        typeof output === "object" &&
        (output as { condition?: boolean }).condition === false
      ) {
        await prisma.nodeLog.create({
          data: {
            executionId: context.executionId,
            nodeId: node.id,
            status: "success",
            output: JSON.stringify(output),
          },
        });

        await writeLog(
          context.executionId,
          "info",
          `Node "${node.data.label}": kondisi tidak terpenuhi, branch dihentikan`,
        );

        continue;
      }

      await prisma.nodeLog.create({
        data: {
          executionId: context.executionId,
          nodeId: node.id,
          status: "success",
          output: JSON.stringify(output ?? null),
        },
      });

      await writeLog(
        context.executionId,
        "info",
        `Node "${node.data.label}" sukses`,
      );
    } catch (error) {
      hasFailed = true;

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await prisma.nodeLog.create({
        data: {
          executionId: context.executionId,
          nodeId: node.id,
          status: "failed",
          output: JSON.stringify({ error: errorMessage }),
        },
      });

      await writeLog(
        context.executionId,
        "error",
        `Node "${node.data.label}" gagal: ${errorMessage}`,
      );

      break;
    }
  }

  return { status: hasFailed ? "failed" : "success", lastOutput };
}

/**
 * Executes a single node in isolation with a caller-supplied sample input, for
 * the editor's per-node "Test Run". No Execution row is created, so this has no
 * side effects on execution history (though connector nodes still perform their
 * real external calls). Returns the node output or an error message.
 */
export async function runSingleNode(
  workflowId: string,
  ownerId: string,
  node: FlowNode,
  sampleInput: unknown,
): Promise<{ ok: boolean; output?: unknown; error?: string }> {
  const context: RunContext = {
    executionId: `test-${Date.now()}`,
    ownerId,
    workflowId,
    triggerPayload: sampleInput,
  };

  try {
    const output = await runNode(node, sampleInput, context);
    return { ok: true, output };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Runs a workflow and records an Execution with logs. The workflow may pause at
 * a `schedule` or `wait_reply` node, in which case the execution status becomes
 * "waiting" and is resumed later via `resumeWorkflow`.
 *
 * @param triggerPayload optional data that seeds trigger nodes (e.g. webhook body)
 */
export async function runWorkflow(
  workflowId: string,
  triggerPayload?: unknown,
): Promise<string> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });

  if (!workflow) {
    throw new Error("Workflow tidak ditemukan");
  }

  const nodes: FlowNode[] = JSON.parse(workflow.nodes || "[]");
  const edges: FlowEdge[] = JSON.parse(workflow.edges || "[]");

  const execution = await prisma.execution.create({
    data: { workflowId, status: "running" },
  });

  const context: RunContext = {
    executionId: execution.id,
    ownerId: workflow.ownerId,
    workflowId,
    triggerPayload,
  };

  await writeLog(execution.id, "info", `Mulai eksekusi "${workflow.name}"`);

  const orderedNodes = orderNodes(nodes, edges);

  const outcome = await executeNodes(
    orderedNodes,
    edges,
    context,
    0,
    new Map(),
    null,
  );

  if (outcome.status !== "paused") {
    await prisma.execution.update({
      where: { id: execution.id },
      data: {
        status: outcome.status,
        finishedAt: new Date(),
        result: JSON.stringify(outcome.lastOutput ?? null),
      },
    });

    await writeLog(
      execution.id,
      outcome.status === "failed" ? "error" : "info",
      `Eksekusi selesai dengan status ${outcome.status}`,
    );
  }

  return execution.id;
}

/**
 * Resumes a paused execution from its saved cursor. For `wait_reply` pauses the
 * incoming reply payload is merged into each held row so downstream nodes can
 * use {{message}}, {{sender}}, etc.
 */
export async function resumeWorkflow(
  waitingExecutionId: string,
  replyPayload?: Record<string, unknown>,
): Promise<void> {
  const waiting = await prisma.waitingExecution.findUnique({
    where: { id: waitingExecutionId },
  });

  if (!waiting || waiting.status !== "waiting") {
    return;
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id: waiting.workflowId },
  });

  if (!workflow) {
    return;
  }

  const nodes: FlowNode[] = JSON.parse(workflow.nodes || "[]");
  const edges: FlowEdge[] = JSON.parse(workflow.edges || "[]");
  const orderedNodes = orderNodes(nodes, edges);

  const parsedState = JSON.parse(waiting.state) as {
    outputs: Record<string, unknown>;
    cursorIndex: number;
  };

  const outputByNodeId = new Map<string, unknown>(
    Object.entries(parsedState.outputs),
  );

  const pauseNode = orderedNodes[parsedState.cursorIndex];

  if (!pauseNode) {
    return;
  }

  const pauseOutput = outputByNodeId.get(pauseNode.id) as
    | { rows?: Item[] }
    | undefined;
  const pauseRows = pauseOutput?.rows ?? [];

  /** Compute the pause node's real output now that it is unblocked. */
  let resumeOutput: unknown;

  if (waiting.pauseType === "wait_reply") {
    const reply = replyPayload ?? {};

    const enrichedRows = pauseRows.map((row) => ({
      ...row,
      ...reply,
      reply: reply.message,
    }));

    resumeOutput = { rows: enrichedRows, ...reply };
  } else {
    resumeOutput = {
      rows: pauseRows,
      scheduledAt: new Date().toISOString(),
    };
  }

  outputByNodeId.set(pauseNode.id, resumeOutput);

  const context: RunContext = {
    executionId: waiting.executionId,
    ownerId: workflow.ownerId,
    workflowId: waiting.workflowId,
    triggerPayload: replyPayload,
  };

  await prisma.execution.update({
    where: { id: waiting.executionId },
    data: { status: "running" },
  });

  await prisma.waitingExecution.update({
    where: { id: waiting.id },
    data: { status: "resumed" },
  });

  await writeLog(waiting.executionId, "info", "Eksekusi dilanjutkan");

  const outcome = await executeNodes(
    orderedNodes,
    edges,
    context,
    parsedState.cursorIndex + 1,
    outputByNodeId,
    resumeOutput,
  );

  if (outcome.status !== "paused") {
    await prisma.execution.update({
      where: { id: waiting.executionId },
      data: {
        status: outcome.status,
        finishedAt: new Date(),
        result: JSON.stringify(outcome.lastOutput ?? null),
      },
    });

    await writeLog(
      waiting.executionId,
      outcome.status === "failed" ? "error" : "info",
      `Eksekusi selesai dengan status ${outcome.status}`,
    );
  }
}

/**
 * Resumes any `wait_reply` executions whose match key corresponds to the sender
 * of an incoming WhatsApp reply. Phone keys are compared on digits only.
 */
export async function resumeWaitingReplies(
  sender: string,
  replyPayload: Record<string, unknown>,
): Promise<number> {
  const senderDigits = sender.replace(/\D/g, "");

  if (!senderDigits) {
    return 0;
  }

  const waitingList = await prisma.waitingExecution.findMany({
    where: { pauseType: "wait_reply", status: "waiting" },
  });

  let resumedCount = 0;

  for (const waiting of waitingList) {
    const keyDigits = (waiting.matchKey ?? "").replace(/\D/g, "");

    const matches =
      keyDigits.length > 0 &&
      (keyDigits === senderDigits ||
        keyDigits.endsWith(senderDigits) ||
        senderDigits.endsWith(keyDigits));

    if (matches) {
      await resumeWorkflow(waiting.id, replyPayload);
      resumedCount += 1;
    }
  }

  return resumedCount;
}

/**
 * Resumes all `schedule` executions whose due time has passed. Intended to be
 * driven by an external cron (Vercel Cron / QStash) on serverless deploys.
 */
export async function resumeDueSchedules(): Promise<number> {
  const now = BigInt(Date.now());

  const waitingList = await prisma.waitingExecution.findMany({
    where: { pauseType: "schedule", status: "waiting" },
  });

  let resumedCount = 0;

  for (const waiting of waitingList) {
    if (waiting.dueAt !== null && waiting.dueAt <= now) {
      await resumeWorkflow(waiting.id);
      resumedCount += 1;
    }
  }

  return resumedCount;
}
