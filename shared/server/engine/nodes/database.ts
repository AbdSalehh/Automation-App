import { requestExternal } from "@/shared/server/httpClient";
import { resolveTemplate } from "@/shared/server/templating";
import type { Item, NodeHandler } from "../types";
import { loadCredential } from "../credentials";
import { toItems } from "../utils";

/**
 * Membentuk base URL REST (PostgREST) Supabase dari projectUrl kredensial.
 * Contoh: https://abc.supabase.co -> https://abc.supabase.co/rest/v1
 */
function buildRestBaseUrl(projectUrl: string): string {
  const trimmed = projectUrl.trim().replace(/\/+$/, "");

  return `${trimmed}/rest/v1`;
}

/**
 * Header standar PostgREST. `serviceRoleKey` dipakai sebagai apikey sekaligus
 * bearer token agar melewati Row Level Security untuk operasi server-side.
 */
function buildHeaders(serviceRoleKey: string): Record<string, string> {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

interface ColumnMapping {
  column: string;
  value: string;
}

interface QueryFilter {
  column: string;
  operator: string;
  value: string;
}

/**
 * Menormalkan pemetaan kolom dari config. Mendukung dua bentuk:
 *   - Array { column, value } (dari AI builder / JSON).
 *   - String multiline `kolom=nilai` per baris (dari config UI manual).
 */
function parseColumnMappings(raw: unknown): ColumnMapping[] {
  if (Array.isArray(raw)) {
    return raw as ColumnMapping[];
  }

  if (typeof raw === "string") {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf("=");

        if (separatorIndex < 0) {
          return { column: line, value: "" };
        }

        return {
          column: line.slice(0, separatorIndex).trim(),
          value: line.slice(separatorIndex + 1).trim(),
        };
      });
  }

  return [];
}

/**
 * Menormalkan filter query dari config. Mendukung dua bentuk:
 *   - Array { column, operator, value } (dari AI builder / JSON).
 *   - String multiline `kolom operator nilai` per baris (dari config UI).
 */
function parseFilters(raw: unknown): QueryFilter[] {
  if (Array.isArray(raw)) {
    return raw as QueryFilter[];
  }

  if (typeof raw === "string") {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [column, operator, ...rest] = line.split(/\s+/);

        return {
          column: column ?? "",
          operator: operator ?? "eq",
          value: rest.join(" "),
        };
      });
  }

  return [];
}

/** Supabase Insert — menambah baris ke sebuah tabel via PostgREST. */
export const supabaseInsertHandler: NodeHandler = async ({
  node,
  input,
  context,
  config,
}) => {
  const credential = await loadCredential(
    node.data.credentialId,
    context.ownerId,
  );

  if (!credential?.projectUrl || !credential?.serviceRoleKey) {
    throw new Error("Supabase: kredensial tidak lengkap");
  }

  const table = String(config.table ?? "").trim();

  if (!table) {
    throw new Error("Supabase Insert: nama tabel wajib diisi");
  }

  const items = toItems(input);
  const itemsToInsert = items.length > 0 ? items : [{}];

  /**
   * Pemetaan kolom: array { column, value } di mana value mendukung template
   * `{{kolom}}`. Bila kosong, kirim seluruh field item apa adanya.
   */
  const columnMappings = parseColumnMappings(config.columns);

  const rowsToInsert = itemsToInsert.map((item) => {
    if (columnMappings.length === 0) {
      return item;
    }

    const mappedRow: Record<string, unknown> = {};

    for (const mapping of columnMappings) {
      if (!mapping.column) {
        continue;
      }

      mappedRow[mapping.column] = resolveTemplate(mapping.value ?? "", item);
    }

    return mappedRow;
  });

  const response = await requestExternal(
    `${buildRestBaseUrl(credential.projectUrl)}/${encodeURIComponent(table)}`,
    {
      method: "POST",
      headers: {
        ...buildHeaders(credential.serviceRoleKey),
        Prefer: "return=representation",
      },
      data: rowsToInsert,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Supabase Insert: gagal menambah baris (status ${response.status})`,
    );
  }

  const inserted = (response.body as Item[]) ?? [];

  return { inserted: inserted.length, rows: inserted };
};

/** Supabase Query — membaca baris dari sebuah tabel via PostgREST. */
export const supabaseQueryHandler: NodeHandler = async ({
  node,
  input,
  context,
  config,
}) => {
  const credential = await loadCredential(
    node.data.credentialId,
    context.ownerId,
  );

  if (!credential?.projectUrl || !credential?.serviceRoleKey) {
    throw new Error("Supabase: kredensial tidak lengkap");
  }

  const table = String(config.table ?? "").trim();

  if (!table) {
    throw new Error("Supabase Query: nama tabel wajib diisi");
  }

  const firstItem = (toItems(input)[0] ?? {}) as Item;

  const queryUrl = new URL(
    `${buildRestBaseUrl(credential.projectUrl)}/${encodeURIComponent(table)}`,
  );

  /** Kolom yang dipilih (default semua). */
  const selectColumns = String(config.select ?? "*").trim() || "*";
  queryUrl.searchParams.set("select", selectColumns);

  /**
   * Filter PostgREST opsional: array { column, operator, value }. Operator
   * mengikuti sintaks PostgREST (eq, gte, lte, like, dst). Value mendukung
   * template `{{kolom}}`.
   */
  const filters = parseFilters(config.filters);

  for (const filter of filters) {
    if (!filter.column || !filter.operator) {
      continue;
    }

    const resolvedValue = resolveTemplate(filter.value ?? "", firstItem);
    queryUrl.searchParams.append(
      filter.column,
      `${filter.operator}.${resolvedValue}`,
    );
  }

  const orderBy = String(config.orderBy ?? "").trim();

  if (orderBy) {
    queryUrl.searchParams.set("order", orderBy);
  }

  const limit = Number(config.limit ?? 0);

  if (limit > 0) {
    queryUrl.searchParams.set("limit", String(limit));
  }

  const response = await requestExternal(queryUrl.toString(), {
    method: "GET",
    headers: buildHeaders(credential.serviceRoleKey),
  });

  if (!response.ok) {
    throw new Error(
      `Supabase Query: gagal membaca data (status ${response.status})`,
    );
  }

  const rows = (response.body as Item[]) ?? [];

  return { rows, count: rows.length };
};
