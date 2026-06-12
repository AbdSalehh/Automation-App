"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { cn } from "@/shared/lib/utils";

const BRANCH_STYLES: Record<string, string> = {
  true: "bg-emerald-100 text-emerald-700 border-emerald-200",
  false: "bg-rose-100 text-rose-700 border-rose-200",
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  error: "bg-rose-100 text-rose-700 border-rose-200",
};

export function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  style,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const labelString = label ? String(label).toLowerCase() : "";
  const pillStyle =
    BRANCH_STYLES[labelString] ??
    "bg-muted text-muted-foreground border-border";

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-sm",
                pillStyle,
              )}
            >
              <span className="size-1.5 rounded-full bg-current opacity-60" />
              {String(label)}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
