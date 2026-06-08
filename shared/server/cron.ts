/**
 * Minimal 5-field cron matcher (no external dependency).
 *
 * Fields: minute hour day-of-month month day-of-week
 *   minute       0-59
 *   hour         0-23
 *   day-of-month 1-31
 *   month        1-12
 *   day-of-week  0-6 (Sunday = 0)
 *
 * Supports: `*`, single values, lists `a,b`, ranges `a-b`, and steps `* / n`.
 *
 * @example
 * shouldRunCron("0 9 * * *", new Date()) // true at 09:00 every day
 * shouldRunCron("* / 15 * * * *", date)  // every 15 minutes (no spaces)
 *
 * Server-only module.
 */

function matchField(field: string, value: number): boolean {
  if (field === "*") {
    return true;
  }

  // Comma-separated list — any part matching is a match.
  if (field.includes(",")) {
    return field.split(",").some((part) => matchField(part, value));
  }

  // Step: */n or a-b/n
  if (field.includes("/")) {
    const [rangePart, stepPart] = field.split("/");
    const step = Number(stepPart);

    if (!Number.isFinite(step) || step <= 0) {
      return false;
    }

    if (rangePart === "*") {
      return value % step === 0;
    }

    const [start, end] = rangePart.split("-").map(Number);

    if (Number.isFinite(start) && Number.isFinite(end)) {
      for (let candidate = start; candidate <= end; candidate += step) {
        if (candidate === value) {
          return true;
        }
      }
    }

    return false;
  }

  // Range a-b
  if (field.includes("-")) {
    const [start, end] = field.split("-").map(Number);
    return value >= start && value <= end;
  }

  // Single value
  return Number(field) === value;
}

/**
 * Returns true when the given cron expression matches the provided date
 * (to the minute). Invalid expressions return false.
 */
export function shouldRunCron(expression: string, date: Date): boolean {
  const fields = expression.trim().split(/\s+/);

  if (fields.length !== 5) {
    return false;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;

  return (
    matchField(minute, date.getMinutes()) &&
    matchField(hour, date.getHours()) &&
    matchField(dayOfMonth, date.getDate()) &&
    matchField(month, date.getMonth() + 1) &&
    matchField(dayOfWeek, date.getDay())
  );
}
