"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Icon, BrandIcon, type BrandIconName } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

/** Data tampilan untuk satu node ringkas di kanvas landing. */
export interface LandingFlowNodeData {
  label: string;
  description: string;
  category: "trigger" | "action" | "logic";
  icon: string;
  brand: BrandIconName | null;
  /** True saat node ini sedang disorot oleh animasi cascade. */
  active: boolean;
  [key: string]: unknown;
}

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

/**
 * Node ringkas untuk kanvas landing: meniru gaya header `WorkflowNode`
 * (badge ikon brand + judul + subjudul) namun tanpa blok Configurations/
 * Input/Output, sehingga pas ditata berdampingan dan mudah dianimasikan.
 */
export function LandingFlowNode({ data }: NodeProps) {
  const nodeData = data as LandingFlowNodeData;

  return (
    <div
      className={cn(
        "w-[180px] rounded-xl border bg-white px-3 py-2.5 shadow-sm transition-all duration-300",
        nodeData.active
          ? "border-orange-300 shadow-md ring-2 shadow-orange-200/60 ring-orange-300"
          : "border-slate-200",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="size-2! border-2! border-white! bg-slate-300!"
      />

      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-lg",
            nodeData.brand
              ? "bg-white ring-1 ring-slate-200"
              : CATEGORY_ICON_STYLES[nodeData.category],
          )}
        >
          {nodeData.brand ? (
            <BrandIcon name={nodeData.brand} className="size-4" />
          ) : (
            <Icon name={nodeData.icon} className="size-4" />
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[12px] font-semibold text-slate-800">
            {nodeData.label}
          </span>
          <span className="truncate text-[10px] text-slate-400">
            {nodeData.description}
          </span>
        </div>
      </div>

      <span
        className={cn(
          "mt-2 inline-block rounded-md border px-1.5 py-0.5 text-[9px] font-semibold",
          CATEGORY_BADGE_STYLES[nodeData.category],
        )}
      >
        {CATEGORY_BADGE_LABEL[nodeData.category]}
      </span>

      <Handle
        type="source"
        position={Position.Right}
        className="size-2! border-2! border-white! bg-slate-300!"
      />
    </div>
  );
}
