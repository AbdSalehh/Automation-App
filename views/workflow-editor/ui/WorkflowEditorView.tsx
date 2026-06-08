import { WorkflowCanvas } from "@/widgets/workflow-canvas";

export function WorkflowEditorView({ workflowId }: { workflowId: string }) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <WorkflowCanvas workflowId={workflowId} />
    </div>
  );
}
