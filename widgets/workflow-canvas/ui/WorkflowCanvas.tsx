"use client";

import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Spinner } from "@/shared/ui";
import { useWorkflowStore } from "@/entities/workflow";
import { WorkflowEditor, NodePalette } from "@/features/workflow-editor";
import { ExecutionResultPanel } from "./ExecutionResultPanel";

interface WorkflowCanvasProps {
  workflowId: string;
}

export function WorkflowCanvas({ workflowId }: WorkflowCanvasProps) {
  const { isLoading, lastExecutionId, loadWorkflow, reset } =
    useWorkflowStore();

  useEffect(() => {
    loadWorkflow(workflowId);

    return () => reset();
  }, [workflowId, loadWorkflow, reset]);

  if (isLoading) {
    return (
      <div className="grid flex-1 place-items-center text-muted-foreground">
        <span className="flex items-center gap-2">
          <Spinner /> Memuat editor…
        </span>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="flex h-full flex-1 flex-col">
        <div className="flex flex-1 overflow-hidden">
          <NodePalette />
          <WorkflowEditor />
        </div>

        {lastExecutionId && (
          <ExecutionResultPanel
            executionId={lastExecutionId}
            onClose={() => useWorkflowStore.setState({ lastExecutionId: null })}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
}
