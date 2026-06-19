"use client";

import { useMemo } from "react";
import { ReactFlow, Background, type NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentPipelineNode } from "./AgentPipelineNode";
import { AGENT_PIPELINE_NODES, AGENT_PIPELINE_EDGES } from "../model/pipeline";

/**
 * Kanvas read-only yang memvisualisasikan alur tetap agen chat-action. Pengguna
 * tidak dapat menggeser, menyambung, atau memilih node karena alur ini adalah
 * pemicu sistem (bukan workflow yang bisa diedit).
 */
export function AgentPipelineCanvas() {
  const nodeTypes = useMemo<NodeTypes>(
    () => ({ pipelineNode: AgentPipelineNode }),
    [],
  );

  return (
    <div className="border-border bg-muted/30 h-[420px] w-full overflow-hidden rounded-xl border">
      <ReactFlow
        nodes={AGENT_PIPELINE_NODES}
        edges={AGENT_PIPELINE_EDGES}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll={false}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          style: { strokeWidth: 2, stroke: "#94a3b8" },
        }}
      >
        <Background gap={16} />
      </ReactFlow>
    </div>
  );
}
