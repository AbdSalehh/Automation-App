/**
 * Expression engine for the workflow editor and execution engine.
 *
 * Supports an n8n-style mix of:
 *  - Template strings with `{{ ... }}` placeholders, e.g. "Halo {{ payload.name }}"
 *  - Bare variable paths, e.g. `payload.customer.phone`, `items[0].status`
 *  - System variables: `$now`, `$workflow.id`, `$execution.id`
 *  - Raw JavaScript expressions, e.g. `payload.status === "Belum Bayar"`
 *
 * Safe enough for trusted single-tenant use: expressions run via `new Function`
 * with an explicit context, not the global scope. This module is isomorphic so
 * the editor can preview values and the server engine can resolve them.
 */

export interface ExpressionContext {
  /** Current item / row data (the primary data bag). */
  payload?: Record<string, unknown>;
  /** Workflow metadata. */
  $workflow?: { id?: string; name?: string };
  /** Execution metadata. */
  $execution?: { id?: string };
  /** Arbitrary additional bindings (e.g. upstream node outputs). */
  [key: string]: unknown;
}

/** Helper functions exposed inside expressions. */
const EXPRESSION_HELPERS = {
  addDays(date: Date | string, days: number): Date {
    const base = date instanceof Date ? new Date(date) : new Date(date);
    base.setDate(base.getDate() + days);
    return base;
  },
  addHours(date: Date | string, hours: number): Date {
    const base = date instanceof Date ? new Date(date) : new Date(date);
    base.setHours(base.getHours() + hours);
    return base;
  },
  formatDate(date: Date | string): string {
    const base = date instanceof Date ? new Date(date) : new Date(date);
    return Number.isNaN(base.getTime()) ? "" : base.toISOString();
  },
};

/** Builds the binding object every expression is evaluated against. */
function buildBindings(context: ExpressionContext): Record<string, unknown> {
  return {
    payload: context.payload ?? {},
    $now: new Date(),
    $workflow: context.$workflow ?? {},
    $execution: context.$execution ?? {},
    ...EXPRESSION_HELPERS,
    ...context,
  };
}

/**
 * Evaluates a raw JavaScript expression against the context and returns its
 * value. Returns `undefined` on error (callers decide how to surface it).
 */
export function evaluateExpression(
  expression: string,
  context: ExpressionContext,
): unknown {
  const trimmed = expression.trim();

  if (!trimmed) {
    return undefined;
  }

  const bindings = buildBindings(context);
  const bindingKeys = Object.keys(bindings);
  const bindingValues = bindingKeys.map((key) => bindings[key]);

  try {
    /** eslint-disable-next-line no-new-func */
    const evaluator = new Function(
      ...bindingKeys,
      `"use strict"; return (${trimmed});`,
    );

    return evaluator(...bindingValues);
  } catch {
    return undefined;
  }
}

/**
 * Evaluates an expression and coerces the result to a boolean, for use as a
 * branch condition in Code mode.
 */
export function evaluateBooleanExpression(
  expression: string,
  context: ExpressionContext,
): boolean {
  return Boolean(evaluateExpression(expression, context));
}

/**
 * Resolves a template string, replacing every `{{ ... }}` placeholder with the
 * evaluated expression inside it. Text outside the braces is preserved.
 *
 * @example
 * resolveExpression("Halo {{ payload.name }} di {{ $now }}", ctx)
 */
export function resolveExpression(
  template: string,
  context: ExpressionContext,
): string {
  if (!template) {
    return "";
  }

  return template.replace(
    /\{\{\s*([^}]+?)\s*\}\}/g,
    (_match, rawExpression) => {
      const value = evaluateExpression(String(rawExpression), context);

      if (value === undefined || value === null) {
        return "";
      }

      if (value instanceof Date) {
        return value.toISOString();
      }

      if (typeof value === "object") {
        return JSON.stringify(value);
      }

      return String(value);
    },
  );
}

/** Returns true if the string contains at least one `{{ ... }}` placeholder. */
export function hasExpression(value: string): boolean {
  return /\{\{\s*[^}]+?\s*\}\}/.test(value);
}
