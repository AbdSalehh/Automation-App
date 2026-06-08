/**
 * Condition types shared between the editor UI and the execution engine.
 * Client-safe (no server imports).
 */

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "is_empty"
  | "is_not_empty"
  | "greater_than"
  | "less_than"
  | "starts_with"
  | "ends_with";

export interface ConditionRule {
  field: string;
  operator: ConditionOperator;
  value?: string;
}

export interface ConditionGroup {
  match: "all" | "any";
  rules: ConditionRule[];
}

export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: "sama dengan",
  not_equals: "tidak sama dengan",
  contains: "mengandung",
  not_contains: "tidak mengandung",
  is_empty: "kosong",
  is_not_empty: "tidak kosong",
  greater_than: "lebih besar dari",
  less_than: "lebih kecil dari",
  starts_with: "diawali dengan",
  ends_with: "diakhiri dengan",
};

/** Operators that don't need a comparison value. */
export const VALUELESS_OPERATORS: ConditionOperator[] = [
  "is_empty",
  "is_not_empty",
];
