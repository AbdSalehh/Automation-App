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
 * Replaces `{{field}}` placeholders in a template string with values from the
 * provided data object. Missing fields resolve to an empty string.
 *
 * @example
 * resolveTemplate("Halo {{Nama}}", { Nama: "Budi" }) // => "Halo Budi"
 */
export function resolveTemplate(
  template: string,
  data: Record<string, unknown>,
): string {
  if (!template) {
    return "";
  }

  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, rawKey) => {
    const key = String(rawKey).trim();
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
  const cellValue = rawCellValue === undefined || rawCellValue === null
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
