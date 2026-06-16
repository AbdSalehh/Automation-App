"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  MessageSquareReply,
  Sparkles,
  Database,
  Send,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { PipelineNodeData, PipelineNodeKind } from "../model/pipeline";

/**
 * Pemetaan gaya per jenis node pipeline agar tiap langkah mudah dibedakan
 * secara visual di kanvas read-only.
 */
const KIND_STYLES: Record<
  PipelineNodeKind,
  { icon: LucideIcon; accent: string; iconWrap: string }
> = {
  trigger: {
    icon: MessageSquareReply,
    accent: "border-emerald-500/40",
    iconWrap: "bg-emerald-500/10 text-emerald-600",
  },
  ai: {
    icon: Sparkles,
    accent: "border-violet-500/40",
    iconWrap: "bg-violet-500/10 text-violet-600",
  },
  database: {
    icon: Database,
    accent: "border-amber-500/40",
    iconWrap: "bg-amber-500/10 text-amber-600",
  },
  reply: {
    icon: Send,
    accent: "border-sky-500/40",
    iconWrap: "bg-sky-500/10 text-sky-600",
  },
};

export function AgentPipelineNode({ data }: NodeProps) {
  const nodeData = data as PipelineNodeData;
  const style = KIND_STYLES[nodeData.kind];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "w-56 rounded-xl border-2 bg-card p-4 shadow-sm",
        style.accent,
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="size-2! border-none! bg-muted-foreground/40!"
      />

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg",
            style.iconWrap,
          )}
        >
          <Icon className="size-5" />
        </span>

        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {nodeData.title}
          </span>
          <span className="text-xs text-muted-foreground">
            {nodeData.subtitle}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="size-2! border-none! bg-muted-foreground/40!"
      />
    </div>
  );
}
