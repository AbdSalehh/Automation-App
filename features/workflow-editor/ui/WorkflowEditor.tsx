"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { useWorkflowStore, type FlowNode } from "@/entities/workflow";
import { WorkflowNode } from "./WorkflowNode";
import { LabeledEdge } from "./LabeledEdge";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { FlowInfoPanel } from "./FlowInfoPanel";

export function WorkflowEditor() {
  const { nodes, edges, setNodes, setEdges } = useWorkflowStore();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), []);
  const edgeTypes = useMemo(() => ({ labeled: LabeledEdge }), []);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(
        changes,
        nodes as unknown as Node[],
      );
      setNodes(updatedNodes as unknown as FlowNode[]);
    },
    [nodes, setNodes],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(
        changes,
        edges as unknown as Edge[],
      );
      setEdges(updatedEdges as never);
    },
    [edges, setEdges],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        id: uuidv4(),
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null,
      };
      setEdges([...(edges as unknown as Edge[]), newEdge] as never);
    },
    [edges, setEdges],
  );

  const handleNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const selectedNode =
    nodes?.find((node) => node.id === selectedNodeId) ?? null;

  return (
    <div className="flex h-full flex-1">
      <div className="relative flex-1 bg-muted/30">
        <ReactFlow
          nodes={nodes as unknown as Node[]}
          edges={edges as unknown as Edge[]}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          defaultEdgeOptions={{
            type: "labeled",
            style: { strokeWidth: 2, stroke: "#94a3b8" },
          }}
          connectionLineStyle={{ strokeWidth: 2, stroke: "#94a3b8" }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>

      {selectedNode ? (
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
        />
      ) : (
        <FlowInfoPanel />
      )}
    </div>
  );
}
