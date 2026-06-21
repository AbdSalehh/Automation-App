import { requestExternal } from "@/shared/server/httpClient";
import { resolveTemplate } from "@/shared/server/templating";
import { getGoogleAccessToken } from "@/shared/server/google";
import type { Item, NodeHandler } from "../types";
import { loadCredential } from "../credentials";
import { toItems, indexToColumnLetter, stringifyCell } from "../utils";

/**
 * Google Sheets Create — membuat spreadsheet baru atau menambah sheet (tab)
 * baru pada spreadsheet yang sudah ada.
 *
 * Mode (config.mode):
 *   - "new_spreadsheet" (default): buat spreadsheet baru, kembalikan
 *     spreadsheetId + URL agar node berikutnya bisa langsung memakainya.
 *   - "new_sheet": tambah tab baru ke spreadsheetId yang diberikan.
 */
export const googleSheetsCreateHandler: NodeHandler = async ({
  node,
  input,
  context,
  config,
}) => {
  const credential = await loadCredential(
    node.data.credentialId,
    context.ownerId,
  );

  if (!credential) {
    throw new Error("Google Sheets: kredensial tidak ada");
  }

  const accessToken = await getGoogleAccessToken(credential);

  const items = toItems(input);
  const firstItem = items[0] ?? {};

  const mode = String(config.mode ?? "new_spreadsheet");

  const sheetName =
    resolveTemplate(String(config.sheetName ?? ""), firstItem).trim() ||
    "Sheet1";

  if (mode === "new_sheet") {
    const spreadsheetId = String(config.spreadsheetId ?? "").trim();

    if (!spreadsheetId) {
      throw new Error(
        "Google Sheets: spreadsheetId wajib diisi untuk mode new_sheet",
      );
    }

    const response = await requestExternal(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        data: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      },
    );

    if (!response.ok) {
      throw new Error("Google Sheets: gagal menambah sheet baru");
    }

    return {
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      sheetName,
    };
  }

  const title =
    resolveTemplate(String(config.title ?? ""), firstItem).trim() ||
    "Spreadsheet Baru";

  const response = await requestExternal(
    "https://sheets.googleapis.com/v4/spreadsheets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      data: {
        properties: { title },
        sheets: [{ properties: { title: sheetName } }],
      },
    },
  );

  if (!response.ok) {
    throw new Error("Google Sheets: gagal membuat spreadsheet baru");
  }

  const body = response.body as {
    spreadsheetId?: string;
    spreadsheetUrl?: string;
  };

  if (!body.spreadsheetId) {
    throw new Error("Google Sheets: spreadsheetId tidak diterima dari API");
  }

  const newSpreadsheetId = body.spreadsheetId;

  /**
   * Seed isi awal: baris header (config.headers) lalu baris data dummy
   * (config.seedRows). `headers` boleh berupa array atau string dipisah koma.
   * `seedRows` boleh array sel mentah atau objek yang dipetakan ke urutan
   * header. Tanpa header, langkah ini dilewati.
   */
  const headers = normalizeHeaders(config.headers);

  if (headers.length > 0) {
    const seedRows = normalizeSeedRows(config.seedRows, headers, firstItem);

    const seedValues = [headers, ...seedRows];

    const seedResponse = await requestExternal(
      `https://sheets.googleapis.com/v4/spreadsheets/${newSpreadsheetId}/values/${encodeURIComponent(`${sheetName}!A1`)}:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        data: { values: seedValues },
      },
    );

    if (!seedResponse.ok) {
      throw new Error("Google Sheets: gagal mengisi data awal spreadsheet");
    }
  }

  return {
    spreadsheetId: newSpreadsheetId,
    spreadsheetUrl:
      body.spreadsheetUrl ??
      `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}`,
    sheetName,
  };
};

/**
 * Menormalkan daftar header dari config menjadi array string. Menerima array
 * atau string dipisah koma.
 */
function normalizeHeaders(rawHeaders: unknown): string[] {
  if (Array.isArray(rawHeaders)) {
    return rawHeaders.map((header) => String(header).trim()).filter(Boolean);
  }

  if (typeof rawHeaders === "string") {
    return rawHeaders
      .split(",")
      .map((header) => header.trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Menormalkan baris data dummy menjadi array array sel. Tiap baris boleh berupa
 * array sel mentah, atau objek yang dipetakan ke urutan `headers`. Nilai
 * mendukung template `{{...}}` terhadap item input pertama.
 */
function normalizeSeedRows(
  rawSeedRows: unknown,
  headers: string[],
  templateItem: Item,
): string[][] {
  if (!Array.isArray(rawSeedRows)) {
    return [];
  }

  return rawSeedRows.map((row) => {
    if (Array.isArray(row)) {
      return row.map((cell) =>
        stringifyCell(resolveTemplate(String(cell ?? ""), templateItem)),
      );
    }

    if (row && typeof row === "object") {
      const rowObject = row as Record<string, unknown>;

      return headers.map((header) =>
        stringifyCell(
          resolveTemplate(String(rowObject[header] ?? ""), templateItem),
        ),
      );
    }

    return [stringifyCell(row)];
  });
}

/** Google Sheets Append — menambah baris ke spreadsheet. */
export const googleSheetsAppendHandler: NodeHandler = async ({
  node,
  input,
  context,
  config,
}) => {
  const credential = await loadCredential(
    node.data.credentialId,
    context.ownerId,
  );

  if (!credential) {
    throw new Error("Google Sheets: kredensial tidak ada");
  }

  const accessToken = await getGoogleAccessToken(credential);

  const spreadsheetId = resolveTemplate(
    String(config.spreadsheetId ?? ""),
    toItems(input)[0] ?? {},
  ).trim();

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
   * When a field is not found in the item, fall back to empty string instead
   * of the literal column name to avoid writing column headers as data values.
   */
  const values = items.map((item) =>
    columnOrder.length > 0
      ? columnOrder.map((column) => {
          if (column.includes("{{")) {
            return stringifyCell(resolveTemplate(column, item));
          }

          return stringifyCell(item[column]);
        })
      : Object.values(item).map((cell) =>
          stringifyCell(resolveTemplate(String(cell ?? ""), item)),
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
};

/** Google Sheets Read — membaca baris menjadi item beranotasi metadata. */
export const googleSheetsReadHandler: NodeHandler = async ({
  node,
  input,
  context,
  config,
}) => {
  const credential = await loadCredential(
    node.data.credentialId,
    context.ownerId,
  );

  if (!credential) {
    throw new Error("Google Sheets: kredensial tidak ada");
  }

  const accessToken = await getGoogleAccessToken(credential);

  const spreadsheetId = resolveTemplate(
    String(config.spreadsheetId ?? ""),
    toItems(input)[0] ?? {},
  ).trim();

  if (!spreadsheetId) {
    throw new Error("Google Sheets: spreadsheetId wajib diisi");
  }

  /**
   * Prefer a sheet name (reads the whole used range incl. every column). Fall
   * back to an explicit A1 range for backward compatibility.
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
      /** When readColumns is set, keep only those; else keep all. */
      if (readColumns.length === 0 || readColumns.includes(header)) {
        rowObject[header] = row[columnIndex] ?? "";
      }
    });

    /** Attach row metadata so downstream Update nodes can locate the row. */
    rowObject.__rowNumber = String(rowIndex + 2);
    rowObject.__sheetName = resolvedSheetName;

    return rowObject;
  });

  const limit = Number(config.limit ?? 100);

  return {
    rows: dataRows.slice(0, limit),
    headers: readColumns.length > 0 ? readColumns : headers,
    totalRows: dataRows.length,
  };
};

/** Google Sheets Update — menulis nilai ke baris yang dicocokkan. */
export const googleSheetsUpdateHandler: NodeHandler = async ({
  input,
  context,
  config,
  node,
}) => {
  const credential = await loadCredential(
    node.data.credentialId,
    context.ownerId,
  );

  if (!credential) {
    throw new Error("Google Sheets: kredensial tidak ada");
  }

  const items = toItems(input);

  const accessToken = await getGoogleAccessToken(credential);

  const spreadsheetId = resolveTemplate(
    String(config.spreadsheetId ?? ""),
    items[0] ?? {},
  ).trim();

  if (!spreadsheetId) {
    throw new Error("Google Sheets: spreadsheetId wajib diisi");
  }

  if (items.length === 0) {
    return { updated: 0, note: "Tidak ada baris untuk di-update" };
  }

  const fallbackSheetName = String(config.sheetName ?? "Sheet1");

  /**
   * Write targets. New format: writeTargets = [{ column: "Reminder", value:
   * "Sudah Diingatkan {{__waMessageId}}" }] where column is a header name.
   * Legacy format: single targetColumn (letter) + value.
   */
  const writeTargets = Array.isArray(config.writeTargets)
    ? (config.writeTargets as Array<{
        column: string;
        value: string;
        append?: boolean;
      }>)
    : [];

  const legacyColumn = String(config.targetColumn ?? "").trim();
  const legacyValue = String(config.value ?? "");

  if (writeTargets.length === 0 && !legacyColumn) {
    throw new Error(
      "Google Sheets Update: pilih minimal satu kolom untuk ditulis",
    );
  }

  /**
   * Map header name -> column letter by reading the sheet's real header row.
   * This is reliable even when the upstream Read projected a subset of columns.
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
   * Lookup mode: when the incoming items don't carry a __rowNumber (e.g. from a
   * WhatsApp reply trigger), locate the target row by matching a column value.
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

    /**
     * Samakan nomor format lokal/internasional memakai kunci telepon kanonik.
     * Untuk nilai non-telepon (tanpa digit), jatuh ke string yang sudah
     * dipangkas agar kecocokan teks biasa tetap bekerja.
     */
    const matchCountryCode = String(config.countryCode ?? "62");

    const { normalizePhoneKey } = await import("../utils");

    const normalise = (value: string) =>
      normalizePhoneKey(value, matchCountryCode) || value.trim();

    const wanted = normalise(wantedRaw);

    const columnResponse = await requestExternal(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${sheetForHeaders}!${matchLetter}:${matchLetter}`)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const columnValues = (
      (columnResponse.body as { values?: string[][] })?.values ?? []
    ).map((cell) => String(cell[0] ?? ""));

    /** Skip header (index 0). Sheet rows are 1-indexed. */
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

    /** No row number but a match column configured -> look it up. */
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

        const range = `${sheetName}!${columnLetter}${rowNumber}`;
        const newValue = resolveTemplate(target.value, item);

        let finalValue = newValue;

        /**
         * Append mode: baca isi sel saat ini, lalu tambahkan balasan baru
         * sebagai item daftar berpenanda strip ("- ") di baris baru, agar data
         * lama tidak tertimpa dan balasan tampil sebagai list.
         */
        if (target.append) {
          const existingResponse = await requestExternal(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );

          const existingValue = String(
            (existingResponse.body as { values?: string[][] })
              ?.values?.[0]?.[0] ?? "",
          ).trim();

          const listItem = `- ${newValue}`;

          finalValue = existingValue
            ? `${existingValue}\n${listItem}`
            : listItem;
        }

        updates.push({
          range,
          values: [[finalValue]],
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
};
