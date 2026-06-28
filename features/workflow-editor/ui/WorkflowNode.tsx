"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Icon, BrandIcon, Spinner } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import {
  getNodeTypeDef,
  getNodeBrandIcon,
  type WorkflowNodeData,
  type ConditionGroup,
} from "@/entities/workflow";

const CATEGORY_ICON_STYLES: Record<string, string> = {
  trigger: "bg-emerald-100 text-emerald-600",
  action: "bg-blue-100 text-blue-600",
  logic: "bg-amber-100 text-amber-600",
};

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  trigger: "bg-emerald-50 text-emerald-700 border-emerald-200",
  action: "bg-blue-50 text-blue-700 border-blue-200",
  logic: "bg-amber-50 text-amber-700 border-amber-200",
  transform: "bg-violet-50 text-violet-700 border-violet-200",
};

const CATEGORY_BADGE_LABEL: Record<string, string> = {
  trigger: "Input",
  action: "Action",
  logic: "Logic",
  transform: "Transform",
};

const CATEGORY_DOT_STYLES: Record<string, string> = {
  trigger: "bg-emerald-400",
  action: "bg-blue-400",
  logic: "bg-amber-400",
};

const CATEGORY_HANDLE_BG: Record<string, string> = {
  trigger: "bg-emerald-400!",
  action: "bg-blue-400!",
  logic: "bg-amber-400!",
};

/** Config keys rendered by dedicated builders, not the generic preview. */
const SKIP_CONFIG_KEYS = new Set([
  "code",
  "condition",
  "conditions",
  "writeTargets",
  "senderField",
  "targetField",
  "mode",
  "offsets",
  "expression",
  "mappings",
  "__previewSummary",
  "scheduleMode",
  "intervalUnit",
  "intervalEvery",
  "dailyTime",
  "weeklyTime",
  "weeklyDays",
]);

/** Branch output rows that expose their own source handle. */
const BRANCH_OUTPUT_HANDLES: Record<string, string> = {
  true: "bg-emerald-400!",
  false: "bg-rose-400!",
};

const CONDITION_KINDS = new Set(["condition", "filter"]);

/** Friendly English labels for common config keys shown on the node card. */
const CONFIG_KEY_LABELS: Record<string, string> = {
  spreadsheetId: "Spreadsheet",
  sheetName: "Sheet",
  range: "Range",
  target: "Destination Number",
  targetField: "Number Column",
  message: "Message",
  provider: "Provider",
  matchColumn: "Match Column",
  matchValue: "Match Value",
  updateColumn: "Updated Column",
  updateValue: "New Value",
  url: "URL",
  method: "Method",
  to: "Recipient",
  subject: "Subject",
  chatId: "Chat ID",
  text: "Message",
  prompt: "Prompt",
  model: "Model",
  table: "Table",
  cron: "Cron",
};

function formatConfigKey(key: string): string {
  return CONFIG_KEY_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").trim();
}

/**
 * Mengubah nilai config menjadi teks yang aman ditampilkan. Objek/array
 * di-stringify ringkas sebagai JSON agar tidak muncul "[object Object]", dan
 * nilai panjang dipangkas supaya kartu node tetap rapi.
 */
function formatConfigValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** Human-readable summary of a single structured condition rule. */
function describeRule(rule: {
  field?: string;
  operator?: string;
  value?: string;
}): string {
  const field = rule.field || "column";
  const value = rule.value ?? "";

  const operatorLabels: Record<string, string> = {
    equals: "=",
    not_equals: "≠",
    contains: "contains",
    not_contains: "does not contain",
    is_empty: "is empty",
    is_not_empty: "is not empty",
    starts_with: "starts with",
    ends_with: "ends with",
    greater_than: ">",
    less_than: "<",
  };

  const operator = operatorLabels[rule.operator ?? "equals"] ?? "=";

  if (rule.operator === "is_empty" || rule.operator === "is_not_empty") {
    return `${field} ${operator}`;
  }

  return `${field} ${operator} "${value}"`;
}

/** Renders the body section that is specific to a node's kind. */
function NodeBody({ nodeData }: { nodeData: WorkflowNodeData }) {
  const config = nodeData.config ?? {};

  /** Condition / Filter: only show the logic block in code mode. */
  if (CONDITION_KINDS.has(nodeData.kind)) {
    const isCodeMode = String(config.mode ?? "visual") === "code";

    if (isCodeMode) {
      const expression = String(config.expression ?? "").trim();

      return (
        <SectionShell title="Logic Conditions">
          {expression ? (
            <code className="text-foreground block font-mono text-[11px] break-all">
              IF ({expression})
            </code>
          ) : (
            <p className="text-muted-foreground text-[11px] italic">
              No expression yet
            </p>
          )}
        </SectionShell>
      );
    }

    /** Visual mode: render the structured rules as readable text. */
    const group = config.conditions as ConditionGroup | undefined;
    const rules = group?.rules ?? [];

    return (
      <SectionShell title="Logic Conditions">
        {rules.length > 0 ? (
          <div className="flex flex-col gap-1">
            {rules.slice(0, 3).map((rule, ruleIndex) => (
              <code
                key={ruleIndex}
                className="text-foreground block font-mono text-[11px] wrap-break-word"
              >
                {ruleIndex === 0
                  ? "IF "
                  : `${group?.match === "any" ? "OR" : "AND"} `}
                {describeRule(rule)}
              </code>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-[11px] italic">
            No conditions yet
          </p>
        )}
      </SectionShell>
    );
  }

  /** Transform: show mappings or a code snippet. */
  if (nodeData.kind === "transform") {
    const isCodeMode = String(config.mode ?? "keyvalue") === "code";

    if (isCodeMode) {
      const code = String(config.code ?? "").trim();

      return (
        <SectionShell title="Transform Logic">
          {code ? (
            <code className="text-foreground line-clamp-3 block font-mono text-[11px] break-all whitespace-pre-wrap">
              {code}
            </code>
          ) : (
            <p className="text-muted-foreground text-[11px] italic">
              No code yet
            </p>
          )}
        </SectionShell>
      );
    }

    const mappings = Array.isArray(config.mappings)
      ? (config.mappings as { key: string; value: string }[])
      : [];

    return (
      <SectionShell title="Transform Logic">
        {mappings.length > 0 ? (
          <div className="flex flex-col gap-1">
            {mappings.slice(0, 3).map((mapping, mappingIndex) => (
              <div
                key={mappingIndex}
                className="flex items-center gap-1.5 font-mono text-[11px]"
              >
                <span className="text-foreground">
                  {mapping.key || "field"}
                </span>
                <span className="text-muted-foreground">←</span>
                <span className="text-muted-foreground truncate">
                  {mapping.value || "—"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-[11px] italic">
            No mappings yet
          </p>
        )}
      </SectionShell>
    );
  }

  /** WhatsApp Send: tonjolkan kolom/nomor tujuan dan ringkasan pesan. */
  if (nodeData.kind === "whatsapp_send") {
    const targetColumn = String(config.targetField ?? "").trim();
    const manualTarget = String(config.target ?? "").trim();
    const message = String(config.message ?? "").trim();
    const provider = String(config.provider ?? "baileys");

    return (
      <SectionShell title="Configurations">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-muted-foreground shrink-0 text-[11px]">
              Destination
            </span>
            <span className="text-foreground line-clamp-1 text-right text-[11px] font-medium">
              {targetColumn ? `Column: ${targetColumn}` : manualTarget || "—"}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-muted-foreground shrink-0 text-[11px]">
              Message
            </span>
            <span className="text-foreground line-clamp-2 text-right text-[11px] font-medium wrap-break-word">
              {message || "—"}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-muted-foreground shrink-0 text-[11px]">
              Provider
            </span>
            <span className="text-foreground text-right text-[11px] font-medium capitalize">
              {provider}
            </span>
          </div>
        </div>
      </SectionShell>
    );
  }

  /** Default: generic key/value configuration preview. */
  const entries = Object.entries(config)
    .filter(
      ([key, value]) =>
        !SKIP_CONFIG_KEYS.has(key) &&
        value !== "" &&
        value !== null &&
        value !== undefined,
    )
    .slice(0, 5);

  return (
    <SectionShell title="Configurations">
      {entries.length > 0 ? (
        <div className="flex flex-col gap-1">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-start justify-between gap-2">
              <span className="text-muted-foreground shrink-0 text-[11px] capitalize">
                {formatConfigKey(key)}
              </span>
              <span className="text-foreground line-clamp-2 text-right text-[11px] font-medium wrap-break-word">
                {formatConfigValue(value)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-[11px] italic">
          Not configured yet
        </p>
      )}
    </SectionShell>
  );
}

/** Shared wrapper giving each body section a labeled, rounded, tinted block. */
function SectionShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border/70 bg-muted/40 rounded-lg border px-2.5 py-2">
      <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wide uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

export function WorkflowNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  const nodeTypeDef = getNodeTypeDef(nodeData.kind);
  const category = nodeTypeDef?.category ?? "action";
  const isTrigger = category === "trigger";

  const handleBg = CATEGORY_HANDLE_BG[category];
  const namedOutputs = nodeTypeDef?.outputs ?? [];

  /** Ikon brand resmi (WhatsApp, Gmail, dll.) bila node ini bermerek. */
  const brandIcon = getNodeBrandIcon(nodeData.kind);

  /** Transform gets its own badge tint even though its category is "logic". */
  const badgeKey = nodeData.kind === "transform" ? "transform" : category;

  /** Outputs that act as flow branches get their own colored source handle. */
  const hasBranchOutputs = namedOutputs.some(
    (outputKey) => outputKey in BRANCH_OUTPUT_HANDLES,
  );

  const previewSummary =
    typeof nodeData.config?.__previewSummary === "string"
      ? (nodeData.config.__previewSummary as string)
      : "";

  /**
   * Status animasi run yang di-inject editor: idle | running | done | failed.
   * Menentukan spinner dan warna ring di sekeliling node.
   */
  const runState =
    (data as { __runState?: "idle" | "running" | "done" | "failed" })
      ?.__runState ?? "idle";

  const isNodeRunning = runState === "running";

  const runRingStyle =
    runState === "running"
      ? "ring-2 ring-indigo-400 ring-offset-2 animate-pulse"
      : runState === "done"
        ? "ring-2 ring-emerald-400 ring-offset-2"
        : runState === "failed"
          ? "ring-2 ring-rose-400 ring-offset-2"
          : "";

  return (
    <div
      className={cn(
        "border-border bg-card w-[280px] rounded-xl border p-2 shadow-md transition-shadow hover:shadow-lg",
        runRingStyle,
        selected && "ring-primary ring-2 ring-offset-2",
      )}
    >
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            "border-card! size-3! rounded-full! border-2!",
            handleBg,
          )}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 px-1.5 pt-1 pb-2">
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-lg",
            brandIcon
              ? "ring-border bg-white ring-1"
              : CATEGORY_ICON_STYLES[category],
          )}
        >
          {brandIcon ? (
            <BrandIcon name={brandIcon} className="size-4" />
          ) : (
            <Icon name={nodeTypeDef?.icon ?? "CircleHelp"} className="size-4" />
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-foreground truncate text-sm font-semibold">
            {nodeData.label}
          </span>
          <span className="text-muted-foreground truncate text-[11px]">
            {nodeTypeDef?.description}
          </span>
        </div>

        {isNodeRunning ? (
          <Spinner className="size-4 shrink-0 text-indigo-500" />
        ) : (
          <span
            className={cn(
              "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
              CATEGORY_BADGE_STYLES[badgeKey],
            )}
          >
            {CATEGORY_BADGE_LABEL[badgeKey]}
          </span>
        )}
      </div>

      {/* Body sections — each a distinct rounded block */}
      <div className="mt-2 flex flex-col gap-2">
        {/* Kind-specific body */}
        <NodeBody nodeData={nodeData} />

        {/* Input block (hidden for triggers) */}
        {!isTrigger && (
          <div className="border-border/70 bg-muted/40 rounded-lg border px-2.5 py-2">
            <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wide uppercase">
              Input
            </p>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="bg-muted-foreground/40 size-1.5 rounded-full" />
              <span className="text-muted-foreground">Input</span>
              <span className="text-muted-foreground/50 ml-auto font-mono text-[10px]">
                {"{}"}
              </span>
            </div>
          </div>
        )}

        {/* Output block — one row per named output */}
        <div className="border-border/70 bg-muted/40 rounded-lg border px-2.5 py-2">
          <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wide uppercase">
            Output
          </p>

          {namedOutputs.length > 0 ? (
            <div className="flex flex-col gap-1">
              {namedOutputs.map((outputKey) => {
                const branchHandle = BRANCH_OUTPUT_HANDLES[outputKey];

                return (
                  <div
                    key={outputKey}
                    className="relative flex items-center gap-2 text-[11px]"
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        branchHandle
                          ? branchHandle.replace("!", "")
                          : CATEGORY_DOT_STYLES[category],
                      )}
                    />
                    <span className="text-foreground truncate">
                      {outputKey}
                    </span>
                    <span className="text-muted-foreground/50 ml-auto font-mono text-[10px]">
                      {"{}"}
                    </span>

                    {branchHandle && (
                      <Handle
                        id={outputKey}
                        type="source"
                        position={Position.Right}
                        className={cn(
                          "border-card! size-3! rounded-full! border-2!",
                          branchHandle,
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  CATEGORY_DOT_STYLES[category],
                )}
              />
              Output
            </div>
          )}

          {previewSummary && (
            <div className="border-border/50 mt-1.5 border-t pt-1.5">
              <span className="text-muted-foreground line-clamp-2 font-mono text-[10px]">
                {previewSummary}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Single source handle for non-branching nodes. */}
      {!hasBranchOutputs && (
        <Handle
          type="source"
          position={Position.Right}
          className={cn(
            "border-card! size-3! rounded-full! border-2!",
            handleBg,
          )}
        />
      )}
    </div>
  );
}
