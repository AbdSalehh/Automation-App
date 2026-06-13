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
 * Default timezone for evaluating cron schedules. Serverless hosts (Vercel)
 * run in UTC, so without this a "07:00" daily schedule would fire at 14:00 WIB.
 * Overridable via the SCHEDULE_TIMEZONE env var.
 */
const SCHEDULE_TIMEZONE = process.env.SCHEDULE_TIMEZONE || "Asia/Jakarta";

interface CronDateParts {
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
}

/**
 * Extracts calendar parts for the given instant as seen in the configured
 * timezone, so cron matching reflects the user's local wall-clock time.
 */
function getPartsInTimezone(date: Date, timeZone: string): CronDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);

  const lookup = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  /** Intl renders midnight as "24" in some runtimes; normalise to 0. */
  const rawHour = Number(lookup("hour"));

  return {
    minute: Number(lookup("minute")),
    hour: rawHour === 24 ? 0 : rawHour,
    dayOfMonth: Number(lookup("day")),
    month: Number(lookup("month")),
    dayOfWeek: weekdayMap[lookup("weekday")] ?? 0,
  };
}

/**
 * Returns true when the cron expression matches the given instant, evaluated in
 * the configured timezone (default Asia/Jakarta). Invalid expressions return
 * false.
 */
export function shouldRunCron(expression: string, date: Date): boolean {
  const fields = expression.trim().split(/\s+/);

  if (fields.length !== 5) {
    return false;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;

  const parts = getPartsInTimezone(date, SCHEDULE_TIMEZONE);

  return (
    matchField(minute, parts.minute) &&
    matchField(hour, parts.hour) &&
    matchField(dayOfMonth, parts.dayOfMonth) &&
    matchField(month, parts.month) &&
    matchField(dayOfWeek, parts.dayOfWeek)
  );
}

/**
 * Checks each minute within a backward window and returns the most recent
 * matching minute slot (as an epoch-ms aligned to the minute), or null if none
 * match. This lets a coarse heartbeat (e.g. every 2 minutes) still catch a
 * schedule that lands on a minute the heartbeat skipped — for example a daily
 * 07:01 reminder when the heartbeat ticks on even minutes only.
 *
 * @param windowMinutes how many minutes back to scan (inclusive of `now`)
 */
export function lastCronMatchWithin(
  expression: string,
  now: Date,
  windowMinutes: number,
): number | null {
  for (let offset = 0; offset < windowMinutes; offset += 1) {
    const candidate = new Date(now.getTime() - offset * 60_000);

    if (shouldRunCron(expression, candidate)) {
      /** Align to the minute so the slot is a stable dedup key. */
      return Math.floor(candidate.getTime() / 60_000) * 60_000;
    }
  }

  return null;
}
