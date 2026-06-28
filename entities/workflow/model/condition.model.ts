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
  equals: "equals",
  not_equals: "does not equal",
  contains: "contains",
  not_contains: "does not contain",
  is_empty: "is empty",
  is_not_empty: "is not empty",
  greater_than: "is greater than",
  less_than: "is less than",
  starts_with: "starts with",
  ends_with: "ends with",
};

/** Operators that don't need a comparison value. */
export const VALUELESS_OPERATORS: ConditionOperator[] = [
  "is_empty",
  "is_not_empty",
];
