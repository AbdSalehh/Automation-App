export type DashboardWidgetType =
  | "metric"
  | "bar"
  | "pie"
  | "line"
  | "table"
  | "text";

export type DashboardAggregation =
  | "count"
  | "count_if"
  | "percentage_if"
  | "sum"
  | "average";

export type DashboardComparisonOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_empty";

export interface DashboardSourceConfig {
  credentialId: string;
  spreadsheetId: string;
  sheetName?: string;
  range?: string;
}

export interface DashboardWidgetBinding {
  column?: string;
  valueColumn?: string;
  aggregation?: DashboardAggregation;
  operator?: DashboardComparisonOperator;
  compareValue?: string;
}

export interface DashboardWidgetLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  layout: DashboardWidgetLayout;
  binding: DashboardWidgetBinding;
  text?: string;
  color?: string;
}

export interface DashboardConfig {
  source?: DashboardSourceConfig;
  widgets: DashboardWidget[];
}

export type DashboardRow = Record<string, string>;

export interface DashboardChartDatum {
  name: string;
  value: number;
}
