"use client";

import { useEffect, useRef, useState } from "react";
import { useExecutionStore } from "@/entities/execution";
import type { FlowNode, FlowEdge } from "@/entities/workflow";

export type NodeRunState = "idle" | "running" | "done" | "failed";

interface RunAnimationState {
  activeNodeId: string | null;
  activeEdgeId: string | null;
  nodeStateById: Record<string, NodeRunState>;
}

const INITIAL_STATE: RunAnimationState = {
  activeNodeId: null,
  activeEdgeId: null,
  nodeStateById: {},
};

const NODE_STEP_MS = 650;
const EDGE_STEP_MS = 700;

/**
 * Mengorkestrasi animasi run berurutan.
 *
 * Backend `runWorkflow` berjalan sinkron, jadi animasi diputar sebagai cascade
 * di sisi klien berdasarkan urutan `nodeLogs` yang benar-benar dieksekusi.
 * Selama menunggu response (`isExecuting`), node trigger pertama ditandai
 * running sebagai indikator indeterminate.
 */
export function useRunAnimation(
  nodes: FlowNode[],
  edges: FlowEdge[],
  isExecuting: boolean,
  animateExecutionId: string | null,
): RunAnimationState {
  const { loadNodeLogs } = useExecutionStore();

  const [state, setState] = useState<RunAnimationState>(INITIAL_STATE);

  /** Menyimpan id timer yang berjalan agar bisa dibersihkan saat unmount/restart. */
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const playedExecutionIdRef = useRef<string | null>(null);

  const clearTimers = () => {
    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current = [];
  };

  /** Indikator indeterminate: tandai node trigger pertama saat run dimulai. */
  useEffect(() => {
    if (!isExecuting) {
      return;
    }

    const triggerNode = nodes.find((node) =>
      node.data.kind.endsWith("_trigger"),
    );

    const firstNode = triggerNode ?? nodes[0];

    if (!firstNode) {
      return;
    }

    /**
     * Dijadwalkan via timer agar tidak memanggil setState sinkron di dalam
     * body effect (mencegah cascading render).
     */
    const startTimer = setTimeout(() => {
      setState({
        activeNodeId: firstNode.id,
        activeEdgeId: null,
        nodeStateById: { [firstNode.id]: "running" },
      });
    }, 0);

    return () => clearTimeout(startTimer);
  }, [isExecuting, nodes]);

  /** Saat run selesai, putar cascade berdasarkan urutan nodeLogs. */
  useEffect(() => {
    if (!animateExecutionId || isExecuting) {
      return;
    }

    if (playedExecutionIdRef.current === animateExecutionId) {
      return;
    }

    playedExecutionIdRef.current = animateExecutionId;

    let isCancelled = false;

    const playCascade = async () => {
      const nodeLogs = await loadNodeLogs(animateExecutionId);

      if (isCancelled || nodeLogs.length === 0) {
        return;
      }

      /** Urutan node sesuai eksekusi nyata. */
      const sequence = nodeLogs.map((log) => ({
        nodeId: log.nodeId,
        status: log.status,
      }));

      const nodeStateById: Record<string, NodeRunState> = {};
      let stepDelay = 0;

      sequence.forEach((step, stepIndex) => {
        /** Tandai node sebagai running. */
        const runningTimer = setTimeout(() => {
          if (isCancelled) {
            return;
          }

          setState({
            activeNodeId: step.nodeId,
            activeEdgeId: null,
            nodeStateById: { ...nodeStateById, [step.nodeId]: "running" },
          });
        }, stepDelay);

        timersRef.current.push(runningTimer);
        stepDelay += NODE_STEP_MS;

        /** Tandai node selesai (done/failed) sesuai status log. */
        const finalState: NodeRunState =
          step.status === "failed" ? "failed" : "done";

        const doneTimer = setTimeout(() => {
          if (isCancelled) {
            return;
          }

          nodeStateById[step.nodeId] = finalState;

          /** Cari edge menuju node berikutnya untuk dianimasikan. */
          const nextStep = sequence[stepIndex + 1];
          const connectingEdge = nextStep
            ? edges.find(
                (edge) =>
                  edge.source === step.nodeId &&
                  edge.target === nextStep.nodeId,
              )
            : undefined;

          setState({
            activeNodeId: null,
            activeEdgeId: connectingEdge?.id ?? null,
            nodeStateById: { ...nodeStateById },
          });
        }, stepDelay);

        timersRef.current.push(doneTimer);

        /** Beri waktu animasi edge bergerak sebelum node berikutnya running. */
        if (stepIndex < sequence.length - 1) {
          stepDelay += EDGE_STEP_MS;
        }
      });

      /** Bersihkan highlight edge di akhir cascade. */
      const cleanupTimer = setTimeout(() => {
        if (isCancelled) {
          return;
        }

        setState((previous) => ({ ...previous, activeEdgeId: null }));
      }, stepDelay + NODE_STEP_MS);

      timersRef.current.push(cleanupTimer);
    };

    void playCascade();

    return () => {
      isCancelled = true;
      clearTimers();
    };
  }, [animateExecutionId, isExecuting, edges, loadNodeLogs]);

  /** Bersihkan semua timer saat unmount. */
  useEffect(() => clearTimers, []);

  return state;
}
