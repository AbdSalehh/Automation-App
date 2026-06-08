import type { WorkflowNodeData } from "./node.model";

/** A React Flow node as persisted in the workflow definition. */
export interface FlowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

/** A React Flow edge connecting two nodes. */
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  ownerId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  version: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  version: number;
  isPublished: boolean;
  updatedAt: string;
  nodeCount: number;
}

export interface CreateWorkflowPayload {
  name: string;
}

export interface UpdateWorkflowPayload {
  name?: string;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  isPublished?: boolean;
}
