"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
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
import { Modal, toast } from "@/shared/ui";
import { useExecutionStore } from "@/entities/execution";
import { useWhatsappReplyStore } from "@/entities/whatsapp-reply";
import { WorkflowNode } from "./WorkflowNode";
import { LabeledEdge } from "./LabeledEdge";
import { CanvasControls } from "./CanvasControls";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { FlowInfoPanel } from "./FlowInfoPanel";
import { useRunAnimation } from "../model/useRunAnimation";

export function WorkflowEditor() {
  const { nodes, edges, setNodes, setEdges, workflowId, isExecuting } =
    useWorkflowStore();

  const { latestStatus, pollLatestStatus } = useExecutionStore();

  const { replies, subscribeReplies, unsubscribeReplies } =
    useWhatsappReplyStore();

  const { data: session } = useSession();

  const sessionId = session?.user?.id ?? "";

  /** Jumlah balasan yang sudah ditoast, agar hanya balasan baru yang muncul. */
  const toastedReplyCountRef = useRef(0);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(true);
  const [isJsonOpen, setIsJsonOpen] = useState(false);

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), []);
  const edgeTypes = useMemo(() => ({ labeled: LabeledEdge }), []);

  const { fetchPreview, fetchSheetList } = useSheetPreviewStore();

  const { lastExecutionId } = useWorkflowStore();

  /** True while the most recent run (manual or scheduled) is in progress. */
  const isRunning = isExecuting || latestStatus === "running";

  /**
   * State animasi run berurutan: node yang sedang berjalan (spinner), edge yang
   * sedang dilewati, dan status akhir tiap node (done/failed).
   */
  const { activeEdgeId, nodeStateById } = useRunAnimation(
    nodes,
    edges,
    isExecuting,
    lastExecutionId,
  );

  /**
   * Poll the latest execution status while a run is active so edges keep
   * animating until the workflow finishes. Stops once status leaves "running".
   */
  useEffect(() => {
    if (!workflowId) {
      return;
    }

    pollLatestStatus(workflowId);

    if (!isRunning) {
      return;
    }

    const intervalId = setInterval(() => {
      pollLatestStatus(workflowId);
    }, 2000);

    return () => clearInterval(intervalId);
  }, [workflowId, isRunning, pollLatestStatus]);

  /**
   * Berlangganan balasan WhatsApp realtime via Ably selama editor terbuka,
   * lalu berhenti berlangganan saat editor dilepas. Menggantikan polling.
   */
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    subscribeReplies(sessionId);

    return () => {
      unsubscribeReplies();
    };
  }, [sessionId, subscribeReplies, unsubscribeReplies]);

  /**
   * Memunculkan toast untuk tiap balasan baru yang diterima lewat Ably. Hanya
   * balasan yang belum pernah ditoast (di luar baseline awal) yang ditampilkan.
   */
  useEffect(() => {
    if (replies.length <= toastedReplyCountRef.current) {
      toastedReplyCountRef.current = replies.length;
      return;
    }

    const newReplies = replies.slice(toastedReplyCountRef.current);

    for (const reply of newReplies) {
      const senderLabel = reply.name || reply.sender || "WhatsApp";

      toast.info(`📩 Balasan dari ${senderLabel}`, {
        description: reply.message,
      });
    }

    toastedReplyCountRef.current = replies.length;
  }, [replies]);

  /** Animasikan hanya edge yang sedang aktif (berurutan), bukan semua edge. */
  const displayEdges = useMemo(() => {
    const baseEdges = edges as unknown as Edge[];

    return baseEdges.map((edge) => ({
      ...edge,
      data: { ...edge.data, animated: edge.id === activeEdgeId },
    }));
  }, [edges, activeEdgeId]);

  /** Inject run-state ke tiap node agar bisa menampilkan spinner / status. */
  const displayNodes = useMemo(() => {
    const baseNodes = nodes as unknown as Node[];

    return baseNodes.map((node) => ({
      ...node,
      data: { ...node.data, __runState: nodeStateById[node.id] ?? "idle" },
    }));
  }, [nodes, nodeStateById]);

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
          nodes={displayNodes}
          edges={displayEdges}
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
