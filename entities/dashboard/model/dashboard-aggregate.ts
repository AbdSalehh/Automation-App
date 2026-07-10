import type {
  DashboardAggregation,
  DashboardChartDatum,
  DashboardComparisonOperator,
  DashboardRow,
  DashboardWidgetBinding,
} from "./dashboard.model";

function normalizeValue(value: string | undefined): string {
  return String(value ?? "").trim();
}

function toNumber(value: string | undefined): number {
  const normalizedValue = normalizeValue(value).replace(/,/g, ".");
  const numberValue = Number(normalizedValue);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function matchesCondition(
  row: DashboardRow,
  binding: DashboardWidgetBinding,
): boolean {
  const column = binding.column;

  if (!column) {
    return false;
  }

  const cellValue = normalizeValue(row[column]).toLowerCase();
  const compareValue = normalizeValue(binding.compareValue).toLowerCase();
  const operator: DashboardComparisonOperator = binding.operator ?? "equals";

  if (operator === "not_empty") {
    return cellValue.length > 0;
  }

  if (operator === "contains") {
    return cellValue.includes(compareValue);
  }

  if (operator === "not_equals") {
    return cellValue !== compareValue;
  }

  return cellValue === compareValue;
}

export function computeDashboardMetric(
  rows: DashboardRow[],
  binding: DashboardWidgetBinding,
): number {
  const aggregation: DashboardAggregation = binding.aggregation ?? "count";

  if (aggregation === "count") {
    return rows.length;
  }

  if (aggregation === "count_if") {
    return rows.filter((row) => matchesCondition(row, binding)).length;
  }

  if (aggregation === "percentage_if") {
    if (rows.length === 0) {
      return 0;
    }

    const matchedRows = rows.filter((row) => matchesCondition(row, binding));

    return Math.round((matchedRows.length / rows.length) * 100);
  }

  const valueColumn = binding.valueColumn ?? binding.column;

  if (!valueColumn) {
    return 0;
  }

  const totalValue = rows.reduce(
    (total, row) => total + toNumber(row[valueColumn]),
    0,
  );

  if (aggregation === "average") {
    return rows.length > 0 ? Math.round(totalValue / rows.length) : 0;
  }

  return totalValue;
}

export function groupDashboardRows(
  rows: DashboardRow[],
  binding: DashboardWidgetBinding,
): DashboardChartDatum[] {
  const column = binding.column;

  if (!column) {
    return [];
  }

  const groupMap = new Map<string, number>();

  rows.forEach((row) => {
    const groupName = normalizeValue(row[column]) || "Kosong";
    const currentValue = groupMap.get(groupName) ?? 0;

    groupMap.set(groupName, currentValue + 1);
  });

  return Array.from(groupMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((firstDatum, secondDatum) => secondDatum.value - firstDatum.value);
}

export function getDashboardColumns(rows: DashboardRow[]): string[] {
  const firstRow = rows[0];

  if (!firstRow) {
    return [];
  }

  return Object.keys(firstRow);
}
