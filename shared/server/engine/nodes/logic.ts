import {
  resolveTemplate,
  evaluateConditionGroup,
  type ConditionGroup,
} from "@/shared/server/templating";
import {
  resolveExpression,
  evaluateBooleanExpression,
} from "@/shared/lib/expression";
import type { Item, NodeHandler } from "../types";
import { toItems, normalizePhoneKey } from "../utils";

/** Filter Rows — menyaring item berdasarkan grup kondisi. */
export const filterHandler: NodeHandler = async ({ input, config }) => {
  const conditionGroup = (config.conditions as ConditionGroup) ?? {
    match: "all",
    rules: [],
  };

  const items = toItems(input);
  const matchedRows = items.filter((item) =>
    evaluateConditionGroup(conditionGroup, item),
  );

  return {
    rows: matchedRows,
    headers: Object.keys(items[0] ?? {}),
    totalRows: matchedRows.length,
    filteredOut: items.length - matchedRows.length,
  };
};

/** If / Else — meneruskan baris yang cocok; branch berhenti bila tak cocok. */
export const conditionHandler: NodeHandler = async ({
  input,
  config,
  context,
}) => {
  const conditionGroup = config.conditions as ConditionGroup | undefined;
  const items = toItems(input);
  const conditionMode = String(config.mode ?? "visual");
  const customExpression = String(config.expression ?? "").trim();

  /** Code mode: evaluate a JS expression per item against payload context. */
  if (conditionMode === "code" && customExpression) {
    const matchedRows = items.filter((item) =>
      evaluateBooleanExpression(customExpression, {
        payload: item,
        $workflow: { id: context.workflowId },
        $execution: { id: context.executionId },
      }),
    );

    return {
      condition: matchedRows.length > 0,
      rows: matchedRows,
      totalRows: matchedRows.length,
    };
  }

  /** Structured condition (preferred): keep matching rows. */
  if (conditionGroup && Array.isArray(conditionGroup.rules)) {
    const matchedRows = items.filter((item) =>
      evaluateConditionGroup(conditionGroup, item),
    );

    return {
      condition: matchedRows.length > 0,
      rows: matchedRows,
      totalRows: matchedRows.length,
    };
  }

  /** Fallback: legacy JS expression evaluated against the first item. */
  const expression = String(config.expression ?? "true");
  let conditionResult = false;

  try {
    const evaluate = Function("input", `"use strict"; return (${expression});`);
    conditionResult = Boolean(evaluate(input));
  } catch {
    conditionResult = false;
  }

  return { condition: conditionResult, rows: items };
};

/** Function (Code) — menjalankan snippet JavaScript kustom. */
export const functionHandler: NodeHandler = async ({ input, config }) => {
  const userCode = String(config.code ?? "return input;");

  const runUserCode = Function("input", `"use strict"; ${userCode}`);

  return runUserCode(input);
};

/** Transform — memetakan ulang data (mode key/value atau JavaScript). */
export const transformHandler: NodeHandler = async ({
  input,
  config,
  context,
}) => {
  const items = toItems(input);
  const transformMode = String(config.mode ?? "keyvalue");

  const expressionContext = (item: Item) => ({
    payload: item,
    $workflow: { id: context.workflowId },
    $execution: { id: context.executionId },
  });

  /** Code mode: run a JS transform returning a new object per item. */
  if (transformMode === "code") {
    const userCode = String(config.code ?? "return payload;");

    const transformedRows = items.map((item) => {
      try {
        const runTransform = Function(
          "payload",
          "$now",
          `"use strict"; ${userCode}`,
        );

        return (runTransform(item, new Date()) ?? {}) as Item;
      } catch {
        return item;
      }
    });

    return {
      rows: transformedRows,
      result: transformedRows[0] ?? {},
      totalRows: transformedRows.length,
    };
  }

  /** Key/value mode: map each output field via a {{ }} template. */
  const mappings = Array.isArray(config.mappings)
    ? (config.mappings as { key: string; value: string }[])
    : [];

  const transformedRows = items.map((item) => {
    const mapped: Record<string, unknown> = {};

    for (const mapping of mappings) {
      if (!mapping.key) {
        continue;
      }

      mapped[mapping.key] = resolveExpression(
        mapping.value ?? "",
        expressionContext(item),
      );
    }

    return mapped as Item;
  });

  return {
    rows: transformedRows,
    result: transformedRows[0] ?? {},
    totalRows: transformedRows.length,
  };
};

/** Date Calculator — menghitung tanggal relatif/absolut per baris. */
export const dateCalculatorHandler: NodeHandler = async ({ input, config }) => {
  const items = toItems(input);

  const mode = String(config.mode ?? "relative");
  const operation = String(config.operation ?? "subtract");
  const dateField = String(config.dateField ?? "").trim();
  const time = String(config.time ?? "").trim();
  const absoluteDate = String(config.absoluteDate ?? "").trim();

  /** Offset units; falls back to the legacy `days` field when present. */
  const offsets = (config.offsets as Record<string, unknown>) ?? {};
  const offsetMinutes = Number(offsets.minutes ?? 0);
  const offsetHours = Number(offsets.hours ?? 0);
  const offsetDays = Number(offsets.days ?? config.days ?? 0);
  const offsetMonths = Number(offsets.months ?? 0);
  const offsetYears = Number(offsets.years ?? 0);

  const applyTimeOverride = (targetDate: Date) => {
    if (time && /^\d{1,2}:\d{2}$/.test(time)) {
      const [hours, minutes] = time.split(":").map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
    }
  };

  const enrichedRows = items.map((item) => {
    let computedDate = "";

    if (mode === "absolute") {
      const fixedDate = absoluteDate ? new Date(absoluteDate) : new Date();

      if (!Number.isNaN(fixedDate.getTime())) {
        applyTimeOverride(fixedDate);
        computedDate = fixedDate.toISOString();
      }

      return { ...item, computedDate };
    }

    const baseRaw = dateField ? String(item[dateField] ?? "") : "";
    const baseDate = baseRaw ? new Date(baseRaw) : new Date();

    if (!Number.isNaN(baseDate.getTime())) {
      const sign = operation === "add" ? 1 : -1;

      baseDate.setFullYear(baseDate.getFullYear() + sign * offsetYears);
      baseDate.setMonth(baseDate.getMonth() + sign * offsetMonths);
      baseDate.setDate(baseDate.getDate() + sign * offsetDays);
      baseDate.setHours(baseDate.getHours() + sign * offsetHours);
      baseDate.setMinutes(baseDate.getMinutes() + sign * offsetMinutes);

      applyTimeOverride(baseDate);

      computedDate = baseDate.toISOString();
    }

    return { ...item, computedDate };
  });

  return {
    rows: enrichedRows,
    computedDate: enrichedRows[0]?.computedDate ?? "",
    totalRows: enrichedRows.length,
  };
};

/** Schedule — menjeda eksekusi sampai waktu tertentu (sentinel __pause). */
export const scheduleHandler: NodeHandler = async ({ input, config }) => {
  const items = toItems(input);
  const firstItem = items[0] ?? {};

  const dateField = String(config.dateField ?? "computedDate").trim();
  const explicitDate = String(config.executeDate ?? "").trim();
  const time = String(config.time ?? "").trim();

  const targetRaw = explicitDate
    ? resolveTemplate(explicitDate, firstItem)
    : String(firstItem[dateField] ?? "");

  const dueDate = targetRaw ? new Date(targetRaw) : null;

  if (dueDate && time && /^\d{1,2}:\d{2}$/.test(time)) {
    const [hours, minutes] = time.split(":").map(Number);
    dueDate.setHours(hours, minutes, 0, 0);
  }

  const dueAt =
    dueDate && !Number.isNaN(dueDate.getTime())
      ? dueDate.getTime()
      : Date.now();

  /** Future due time -> pause the workflow until the scheduler resumes it. */
  if (dueAt > Date.now()) {
    return { __pause: "schedule", dueAt, rows: items };
  }

  return { rows: items, scheduledAt: new Date(dueAt).toISOString() };
};

/** Wait Reply — menjeda eksekusi sampai target membalas (sentinel __pause). */
export const waitReplyHandler: NodeHandler = async ({ input, config }) => {
  const items = toItems(input);

  const matchField = String(config.matchField ?? "").trim();

  /** Kode negara untuk menormalkan nomor (default Indonesia 62). */
  const replyCountryCode = String(config.countryCode ?? "62");

  /**
   * Computes the reply match key (usually a phone number) for a single row.
   * Each target waits independently, so the key is derived per row rather than
   * from the first row only. Nomor dinormalkan ke kunci kanonik agar cocok
   * dengan balasan yang tiba dalam format internasional.
   */
  const computeMatchKey = (row: Item): string => {
    const rawKey =
      resolveTemplate(String(config.matchValue ?? ""), row) ||
      (matchField ? String(row[matchField] ?? "") : "") ||
      String(row.__waTarget ?? row.phone ?? row.Nomor ?? row.nomor ?? "");

    return normalizePhoneKey(rawKey, replyCountryCode) || rawKey.trim();
  };

  /** One wait target per row; rows without a usable key are dropped. */
  const waitTargets = items
    .map((row) => ({ matchKey: computeMatchKey(row), row }))
    .filter((target) => target.matchKey.length > 0);

  return { __pause: "wait_reply", waitTargets, rows: items };
};

/**
 * Trigger sederhana (manual/schedule/sheets/calendar/webhook). Mengembalikan
 * triggerPayload bila ada, atau penanda triggered default.
 */
export const passthroughTriggerHandler: NodeHandler = async ({ context }) =>
  context.triggerPayload ?? {
    triggered: true,
    at: new Date().toISOString(),
  };
