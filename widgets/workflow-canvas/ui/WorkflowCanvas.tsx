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
      <div className="text-muted-foreground grid flex-1 place-items-center">
        <span className="flex items-center gap-2">
          <Spinner /> Loading editor…
        </span>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="flex h-full flex-1 flex-col">
        <div className="bg-muted/30 flex flex-1 gap-3 overflow-hidden p-3">
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
