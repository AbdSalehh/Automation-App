/**
 * Templating & condition helpers for the workflow engine.
 *
 * Lets users write dynamic values like "Halo {{Nama}}, tagihan {{Pesanan}}"
 * which get resolved against the current row/item data, and provides a
 * structured condition evaluator (field + operator + value) so non-technical
 * users can branch the flow without writing JavaScript.
 *
 * Server-only module.
 */

import type {
  ConditionOperator,
  ConditionRule,
  ConditionGroup,
} from "@/entities/workflow/model/condition.model";

export type { ConditionOperator, ConditionRule, ConditionGroup };

/**
 * Mengambil nilai bersarang dari sebuah objek memakai jalur titik, mis.
 * pluck({ a: { b: 1 } }, ["a", "b"]) => 1. Mengembalikan undefined bila salah
 * satu segmen tidak ada.
 */
function pluck(source: unknown, path: string[]): unknown {
  let current: unknown = source;

  for (const segment of path) {
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Replaces `{{field}}` placeholders in a template string with values from the
 * provided data object. Missing fields resolve to an empty string.
 *
 * Bila `nodeOutputs` diberikan, placeholder berbentuk `{{ref.field}}` (mis.
 * `{{n1.spreadsheetId}}`) di-resolve dari output node ber-ref tersebut. Ini
 * memungkinkan satu node memakai hasil node lain (mis. spreadsheetId dari node
 * create). Bila ref tidak dikenal, placeholder tetap dicocokkan ke `data`.
 *
 * @example
 * resolveTemplate("Halo {{Nama}}", { Nama: "Budi" }) // => "Halo Budi"
 * resolveTemplate("{{n1.spreadsheetId}}", {}, { n1: { spreadsheetId: "abc" } }) // => "abc"
 */
export function resolveTemplate(
  template: string,
  data: Record<string, unknown>,
  nodeOutputs?: Record<string, unknown>,
): string {
  if (!template) {
    return "";
  }

  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, rawKey) => {
    const key = String(rawKey).trim();

    /**
     * Referensi antar-node: `ref.field` (atau lebih dalam). Hanya dipakai bila
     * segmen pertama benar-benar dikenal sebagai ref node, agar key datar yang
     * kebetulan memuat titik tidak salah resolve.
     */
    if (nodeOutputs && key.includes(".")) {
      const [refSegment, ...restSegments] = key.split(".");

      if (Object.prototype.hasOwnProperty.call(nodeOutputs, refSegment)) {
        const resolved = pluck(nodeOutputs[refSegment], restSegments);

        if (resolved === undefined || resolved === null) {
          return "";
        }

        return String(resolved);
      }
    }

    const value = data[key];

    if (value === undefined || value === null) {
      return "";
    }

    return String(value);
  });
}

/** Evaluates a single rule against an item. */
function evaluateRule(
  rule: ConditionRule,
  data: Record<string, unknown>,
): boolean {
  const rawCellValue = data[rule.field];
  const cellValue =
    rawCellValue === undefined || rawCellValue === null
      ? ""
      : String(rawCellValue);

  const comparison = resolveTemplate(rule.value ?? "", data);

  const normalisedCell = cellValue.trim().toLowerCase();
  const normalisedComparison = comparison.trim().toLowerCase();

  switch (rule.operator) {
    case "equals":
      return normalisedCell === normalisedComparison;

    case "not_equals":
      return normalisedCell !== normalisedComparison;

    case "contains":
      return normalisedCell.includes(normalisedComparison);

    case "not_contains":
      return !normalisedCell.includes(normalisedComparison);

    case "is_empty":
      return cellValue.trim() === "";

    case "is_not_empty":
      return cellValue.trim() !== "";

    case "starts_with":
      return normalisedCell.startsWith(normalisedComparison);

    case "ends_with":
      return normalisedCell.endsWith(normalisedComparison);

    case "greater_than":
      return Number(cellValue) > Number(comparison);

    case "less_than":
      return Number(cellValue) < Number(comparison);

    default:
      return false;
  }
}

/**
 * Evaluates a condition group against an item. Returns true when the item
 * passes the configured rules.
 */
export function evaluateConditionGroup(
  group: ConditionGroup,
  data: Record<string, unknown>,
): boolean {
  const rules = group.rules ?? [];

  if (rules.length === 0) {
    return true;
  }

  if (group.match === "any") {
    return rules.some((rule) => evaluateRule(rule, data));
  }

  return rules.every((rule) => evaluateRule(rule, data));
}
