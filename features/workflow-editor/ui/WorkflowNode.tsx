"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Icon } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { getNodeTypeDef, type WorkflowNodeData } from "@/entities/workflow";

const CATEGORY_LEFT_BORDER: Record<string, string> = {
  trigger: "border-l-emerald-400",
  action: "border-l-blue-400",
  logic: "border-l-amber-400",
};

const CATEGORY_ICON_STYLES: Record<string, string> = {
  trigger: "bg-emerald-100 text-emerald-600",
  action: "bg-blue-100 text-blue-600",
  logic: "bg-amber-100 text-amber-600",
};

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  trigger: "bg-emerald-50 text-emerald-700 border-emerald-200",
  action: "bg-blue-50 text-blue-700 border-blue-200",
  logic: "bg-amber-50 text-amber-700 border-amber-200",
};

const CATEGORY_BADGE_LABEL: Record<string, string> = {
  trigger: "Input",
  action: "Action",
  logic: "Logic",
};

const CATEGORY_HANDLE_BG: Record<string, string> = {
  trigger: "bg-emerald-400!",
  action: "bg-blue-400!",
  logic: "bg-amber-400!",
};

const SKIP_CONFIG_KEYS = new Set([
  "code",
  "condition",
  "conditions",
  "writeTargets",
  "senderField",
  "targetField",
]);

function ConfigPreview({ config }: { config: Record<string, unknown> }) {
  const entries = Object.entries(config)
    .filter(
      ([key, value]) =>
        !SKIP_CONFIG_KEYS.has(key) &&
        value !== "" &&
        value !== null &&
        value !== undefined,
    )
    .slice(0, 3);

  if (entries.length === 0) {
    return (
      <p className="text-[11px] italic text-muted-foreground">
        Belum dikonfigurasi
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-start gap-1.5">
          <span className="shrink-0 text-[10px] font-medium capitalize text-muted-foreground">
            {key.replace(/([A-Z])/g, " $1").trim()}:
          </span>
          <span className="truncate text-[10px] text-foreground">
            {String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function WorkflowNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  const nodeTypeDef = getNodeTypeDef(nodeData.kind);
  const category = nodeTypeDef?.category ?? "action";
  const isTrigger = category === "trigger";
  const isDecision =
    nodeData.kind === "condition" || nodeData.kind === "filter";

  const handleBg = CATEGORY_HANDLE_BG[category];
  const namedOutputs = nodeTypeDef?.outputs ?? [];

  if (isDecision) {
    return (
      <div className="relative grid size-36 place-items-center">
        <Handle
          type="target"
          position={Position.Top}
          className="z-10! size-2.5! rounded-sm! border-2! border-card! bg-amber-400!"
        />

        <div
          className={cn(
            "absolute inset-3 rotate-45 rounded-md border-2 bg-card shadow-sm",
            "border-amber-300",
            selected && "ring-2 ring-primary ring-offset-2",
          )}
        />

        <div className="relative flex flex-col items-center gap-1 px-2 text-center">
          <span className="grid size-6 place-items-center rounded-md bg-amber-100 text-amber-600">
            <Icon
              name={nodeTypeDef?.icon ?? "GitBranch"}
              className="size-3.5"
            />
          </span>
          <span className="max-w-24 truncate text-[11px] font-semibold text-foreground">
            {nodeData.label}
          </span>
        </div>

        <Handle
          id="true"
          type="source"
          position={Position.Right}
          className="z-10! size-2.5! rounded-sm! border-2! border-card! bg-emerald-400!"
        />
        <Handle
          id="false"
          type="source"
          position={Position.Bottom}
          className="z-10! size-2.5! rounded-sm! border-2! border-card! bg-rose-400!"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-[280px] overflow-hidden rounded-xl border border-l-4 bg-card shadow-sm transition-shadow hover:shadow-md",
        CATEGORY_LEFT_BORDER[category],
        selected && "ring-2 ring-primary ring-offset-2",
      )}
    >
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            "size-2.5! rounded-sm! border-2! border-card!",
            handleBg,
          )}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 pb-2 pt-3">
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

        <span
          className={cn(
            "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
            CATEGORY_BADGE_STYLES[category],
          )}
        >
          {CATEGORY_BADGE_LABEL[category]}
        </span>
      </div>

      {/* Config preview */}
      <div className="border-t border-border px-3 py-2">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Configurations
        </p>
        <ConfigPreview config={nodeData.config ?? {}} />
      </div>

      {/* Input row (hidden for triggers) */}
      {!isTrigger && (
        <div className="flex items-center gap-2 border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
          Input
          <span className="ml-auto font-mono text-[10px] text-muted-foreground/50">
            {"{}"}
          </span>
        </div>
      )}

      {/* Output rows — one per named output, or single generic row */}
      <div className="border-t border-border">
        {namedOutputs.length > 0 ? (
          namedOutputs.map((outputKey, outputIndex) => (
            <div
              key={outputKey}
              className={cn(
                "flex items-center gap-2 px-3 py-1 text-[11px] text-muted-foreground",
                outputIndex > 0 && "border-t border-border/40",
              )}
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  category === "trigger"
                    ? "bg-emerald-400"
                    : category === "logic"
                      ? "bg-amber-400"
                      : "bg-blue-400",
                )}
              />
              <span className="truncate">{outputKey}</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground/50">
                {"{}"}
              </span>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full",
                category === "trigger" ? "bg-emerald-400" : "bg-blue-400",
              )}
            />
            Output
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={cn("size-2.5! rounded-sm! border-2! border-card!", handleBg)}
      />
    </div>
  );
}
