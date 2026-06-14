"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Icon, Spinner } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import {
  getNodeTypeDef,
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

function formatConfigKey(key: string): string {
  return key.replace(/([A-Z])/g, " $1").trim();
}

/** Human-readable summary of a single structured condition rule. */
function describeRule(rule: {
  field?: string;
  operator?: string;
  value?: string;
}): string {
  const field = rule.field || "kolom";
  const value = rule.value ?? "";

  const operatorLabels: Record<string, string> = {
    equals: "=",
    not_equals: "≠",
    contains: "mengandung",
    not_contains: "tidak mengandung",
    is_empty: "kosong",
    is_not_empty: "tidak kosong",
    starts_with: "diawali",
    ends_with: "diakhiri",
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
            <code className="block break-all font-mono text-[11px] text-foreground">
              IF ({expression})
            </code>
          ) : (
            <p className="text-[11px] italic text-muted-foreground">
              Belum ada ekspresi
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
                className="block wrap-break-word font-mono text-[11px] text-foreground"
              >
                {ruleIndex === 0
                  ? "IF "
                  : `${group?.match === "any" ? "OR" : "AND"} `}
                {describeRule(rule)}
              </code>
            ))}
          </div>
        ) : (
          <p className="text-[11px] italic text-muted-foreground">
            Belum ada kondisi
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
            <code className="line-clamp-3 block whitespace-pre-wrap break-all font-mono text-[11px] text-foreground">
              {code}
            </code>
          ) : (
            <p className="text-[11px] italic text-muted-foreground">
              Belum ada kode
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
                <span className="truncate text-muted-foreground">
                  {mapping.value || "—"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] italic text-muted-foreground">
            Belum ada pemetaan
          </p>
        )}
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
    .slice(0, 3);

  return (
    <SectionShell title="Configurations">
      {entries.length > 0 ? (
        <div className="flex flex-col gap-1">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-start justify-between gap-2">
              <span className="shrink-0 text-[11px] capitalize text-muted-foreground">
                {formatConfigKey(key)}
              </span>
              <span className="truncate text-right text-[11px] font-medium text-foreground">
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] italic text-muted-foreground">
          Belum dikonfigurasi
        </p>
      )}
    </SectionShell>
  );
}

/** Shared wrapper giving each body section a labeled, tinted block. */
function SectionShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border bg-muted/20 px-3 py-2">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
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
        "w-[280px] overflow-hidden rounded-xl border border-border bg-card shadow-md transition-shadow hover:shadow-lg",
        runRingStyle,
        selected && "ring-2 ring-primary ring-offset-2",
      )}
    >
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            "size-3! rounded-full! border-2! border-card!",
            handleBg,
          )}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 pb-2.5 pt-3">
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-lg",
            CATEGORY_ICON_STYLES[category],
          )}
        >
          <Icon name={nodeTypeDef?.icon ?? "CircleHelp"} className="size-4" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-foreground">
            {nodeData.label}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
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

      {/* Kind-specific body */}
      <NodeBody nodeData={nodeData} />

      {/* Input section (hidden for triggers) */}
      {!isTrigger && (
        <div className="flex items-center gap-2 border-t border-border px-3 py-2 text-[11px]">
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
          <span className="text-muted-foreground">Input</span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground/50">
            {"{}"}
          </span>
        </div>
      )}

      {/* Output section — one relatively-positioned row per named output */}
      <div className="border-t border-border">
        <div className="px-3 pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Output
          </p>
        </div>

        {namedOutputs.length > 0 ? (
          namedOutputs.map((outputKey) => {
            const branchHandle = BRANCH_OUTPUT_HANDLES[outputKey];

            return (
              <div
                key={outputKey}
                className="relative flex items-center gap-2 px-3 py-1.5 text-[11px]"
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    branchHandle
                      ? branchHandle.replace("!", "")
                      : CATEGORY_DOT_STYLES[category],
                  )}
                />
                <span className="truncate text-foreground">{outputKey}</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground/50">
                  {"{}"}
                </span>

                {branchHandle && (
                  <Handle
                    id={outputKey}
                    type="source"
                    position={Position.Right}
                    className={cn(
                      "size-3! rounded-full! border-2! border-card!",
                      branchHandle,
                    )}
                  />
                )}
              </div>
            );
          })
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground">
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
          <div className="border-t border-border/40 px-3 py-1.5">
            <span className="line-clamp-2 font-mono text-[10px] text-muted-foreground">
              {previewSummary}
            </span>
          </div>
        )}

        <div className="pb-2" />
      </div>

      {/* Single source handle for non-branching nodes. */}
      {!hasBranchOutputs && (
        <Handle
          type="source"
          position={Position.Right}
          className={cn(
            "size-3! rounded-full! border-2! border-card!",
            handleBg,
          )}
        />
      )}
    </div>
  );
}
