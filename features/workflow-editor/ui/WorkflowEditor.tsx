"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
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
import {
  useWorkflowStore,
  useSheetPreviewStore,
  type FlowNode,
} from "@/entities/workflow";
import { Modal } from "@/shared/ui";
import { WorkflowNode } from "./WorkflowNode";
import { LabeledEdge } from "./LabeledEdge";
import { CanvasControls } from "./CanvasControls";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { FlowInfoPanel } from "./FlowInfoPanel";

export function WorkflowEditor() {
  const { nodes, edges, setNodes, setEdges } = useWorkflowStore();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(true);
  const [isJsonOpen, setIsJsonOpen] = useState(false);

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), []);
  const edgeTypes = useMemo(() => ({ labeled: LabeledEdge }), []);

  const { fetchPreview, fetchSheetList } = useSheetPreviewStore();

  /** Sheets nodes whose data can be previewed in the bottom drawer. */
  const SHEET_NODE_KINDS = useMemo(
    () =>
      new Set([
        "google_sheets_read",
        "google_sheets_update",
        "google_sheets_append",
        "google_sheets_trigger",
      ]),
    [],
  );

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
        type: "labeled",
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

  /** Double-click a Sheets node to open the bottom data preview drawer. */
  const handleNodeDoubleClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const flowNode = node as unknown as FlowNode;

      if (!SHEET_NODE_KINDS.has(flowNode.data.kind)) {
        return;
      }

      const spreadsheetId = String(flowNode.data.config?.spreadsheetId ?? "");
      const credentialId = flowNode.data.credentialId ?? "";
      const sheetName = String(flowNode.data.config?.sheetName ?? "");

      if (!spreadsheetId || !credentialId) {
        return;
      }

      fetchSheetList({ credentialId, spreadsheetId });
      fetchPreview({ credentialId, spreadsheetId, sheetName });
    },
    [SHEET_NODE_KINDS, fetchPreview, fetchSheetList],
  );

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
          onNodeDoubleClick={handleNodeDoubleClick}
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
          <CanvasControls
            isMiniMapVisible={isMiniMapVisible}
            onToggleMiniMap={() => setIsMiniMapVisible((visible) => !visible)}
            onShowJson={() => setIsJsonOpen(true)}
          />
          {isMiniMapVisible && <MiniMap pannable zoomable />}
        </ReactFlow>
      </div>

      <Modal
        open={isJsonOpen}
        onClose={() => setIsJsonOpen(false)}
        title="Workflow JSON"
      >
        <pre className="max-h-[60vh] overflow-auto rounded-md bg-muted p-3 font-mono text-[11px] text-foreground">
          {JSON.stringify({ nodes, edges }, null, 2)}
        </pre>
      </Modal>

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
