"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { LandingFlowNode, type LandingFlowNodeData } from "./LandingFlowNode";

/** Definisi ringkas satu node landing sebelum dipetakan ke node ReactFlow. */
interface LandingNodeSeed {
  id: string;
  label: string;
  description: string;
  category: LandingFlowNodeData["category"];
  icon: string;
  brand: LandingFlowNodeData["brand"];
  position: { x: number; y: number };
}

interface LandingFlowCanvasProps {
  seeds: LandingNodeSeed[];
  edges: { id: string; source: string; target: string }[];
  /** Interval perpindahan sorot antar node (ms). */
  stepDurationMs?: number;
  className?: string;
}

const INACTIVE_EDGE_COLOR = "#cbd5e1";
const ACTIVE_EDGE_COLOR = "#f97316";

/**
 * Kanvas ReactFlow read-only untuk landing. Membangun node & edge satu kali
 * (lewat useNodesState/useEdgesState) lalu hanya memperbarui `data.active` dan
 * style edge tiap tick. Ini penting: membangun ulang objek node tiap tick akan
 * membuat React Flow kehilangan dimensi terukur sehingga node/edge berkedip
 * hilang. Edge memakai tipe default (bezier).
 */
export function LandingFlowCanvas({
  seeds,
  edges,
  stepDurationMs = 1100,
  className,
}: LandingFlowCanvasProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const nodeTypes = useMemo(() => ({ landingNode: LandingFlowNode }), []);

  const initialNodes = useMemo<Node[]>(
    () =>
      seeds.map((seed, seedIndex) => ({
        id: seed.id,
        type: "landingNode",
        position: seed.position,
        draggable: false,
        selectable: false,
        connectable: false,
        data: {
          label: seed.label,
          description: seed.description,
          category: seed.category,
          icon: seed.icon,
          brand: seed.brand,
          active: seedIndex === 0,
        } satisfies LandingFlowNodeData,
      })),
    [seeds],
  );

  const initialEdges = useMemo<Edge[]>(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "default",
        animated: false,
        style: { strokeWidth: 2, stroke: INACTIVE_EDGE_COLOR },
      })),
    [edges],
  );

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveIndex((current) => (current + 1) % seeds.length);
    }, stepDurationMs);

    return () => clearInterval(intervalId);
  }, [seeds.length, stepDurationMs]);

  /** Sorot node aktif tanpa mengganti objek node (pertahankan dimensi terukur). */
  useEffect(() => {
    const activeNodeId = seeds[activeIndex]?.id;

    setFlowNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: { ...node.data, active: node.id === activeNodeId },
      })),
    );

    setFlowEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const isActive = edge.target === activeNodeId;

        return {
          ...edge,
          animated: isActive,
          style: {
            strokeWidth: 2,
            stroke: isActive ? ACTIVE_EDGE_COLOR : INACTIVE_EDGE_COLOR,
          },
        };
      }),
    );
  }, [activeIndex, seeds, setFlowNodes, setFlowEdges]);

  return (
    <div className={className}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
      </ReactFlow>
    </div>
  );
}
