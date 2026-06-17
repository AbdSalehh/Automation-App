"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
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
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
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

  /** Edge is animated while its workflow execution is running. */
  const isAnimated = Boolean(
    (data as { animated?: boolean } | undefined)?.animated,
  );

  const edgeStyle = isAnimated
    ? { ...style, stroke: "#6366f1", strokeWidth: 2.5 }
    : style;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyle}
        markerEnd={markerEnd}
      />

      {isAnimated && (
        <circle r="5" fill="#6366f1">
          <animateMotion dur="1.6s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

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
