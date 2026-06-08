import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { workflowService } from "../service/workflow.service";
import { getNodeTypeDef, type NodeKind } from "../model/node.model";
import type { FlowNode, FlowEdge, Workflow } from "../model/workflow.model";

/**
 * Editor store for a single workflow. Per coding rule #6, all loading/error
 * state and API calls live here rather than inside components.
 */
interface WorkflowEditorState {
  workflowId: string | null;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  isPublished: boolean;

  /** True when there are unsaved changes. */
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isExecuting: boolean;
  errorMessage: string | null;
  lastExecutionId: string | null;

  loadWorkflow: (workflowId: string) => Promise<void>;
  setName: (name: string) => void;
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
  addNodeByKind: (nodeKind: NodeKind) => void;
  updateNodeData: (nodeId: string, data: Partial<FlowNode["data"]>) => void;
  removeNode: (nodeId: string) => void;
  setPublished: (isPublished: boolean) => void;
  getAvailableColumns: () => string[];
  getSheetSources: () => Array<{
    spreadsheetId: string;
    credentialId: string;
    range?: string;
  }>;
  saveWorkflow: () => Promise<void>;
  executeWorkflow: () => Promise<void>;
  reset: () => void;
}

function applyWorkflow(workflow: Workflow) {
  return {
    workflowId: workflow.id,
    name: workflow.name,
    nodes: workflow.nodes,
    edges: workflow.edges,
    isPublished: workflow.isPublished,
    isDirty: false,
  };
}

export const useWorkflowStore = create<WorkflowEditorState>((set, get) => ({
  workflowId: null,
  name: "",
  nodes: [],
  edges: [],
  isPublished: false,

  isDirty: false,
  isLoading: false,
  isSaving: false,
  isExecuting: false,
  errorMessage: null,
  lastExecutionId: null,

  loadWorkflow: async (workflowId) => {
    set({ isLoading: true, errorMessage: null });

    try {
      const workflow = await workflowService.getById(workflowId);
      set(applyWorkflow(workflow));
    } catch {
      set({ errorMessage: "Gagal memuat workflow." });
    } finally {
      set({ isLoading: false });
    }
  },

  setName: (name) => set({ name, isDirty: true }),
  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),

  addNodeByKind: (nodeKind) => {
    const nodeTypeDefinition = getNodeTypeDef(nodeKind);

    if (!nodeTypeDefinition) {
      return;
    }

    const newNode: FlowNode = {
      id: uuidv4(),
      type: "workflowNode",
      position: {
        x: 320 + get().nodes.length * 40,
        y: 120 + get().nodes.length * 70,
      },
      data: { kind: nodeKind, label: nodeTypeDefinition.label, config: {} },
    };

    set((state) => ({ nodes: [...state.nodes, newNode], isDirty: true }));
  },

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node,
      ),
      isDirty: true,
    })),

  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
      isDirty: true,
    })),

  setPublished: (isPublished) => set({ isPublished, isDirty: true }),

  /**
   * Collects column names declared across all source nodes (Sheets Read /
   * Trigger) so condition/filter/message nodes can offer them as choices.
   * Columns are declared per node via the comma-separated `columns` config.
   * Used as a fallback when live spreadsheet headers aren't available.
   */
  getAvailableColumns: () => {
    const columnSet = new Set<string>();

    get().nodes.forEach((node) => {
      const rawColumns = node.data.config?.columns;

      if (typeof rawColumns === "string") {
        rawColumns
          .split(",")
          .map((column) => column.trim())
          .filter(Boolean)
          .forEach((column) => columnSet.add(column));
      }
    });

    return Array.from(columnSet);
  },

  /**
   * Returns the distinct Google Sheets sources referenced by nodes in this
   * workflow (spreadsheetId + credentialId + range). The editor uses these to
   * fetch the real header row so column dropdowns match the spreadsheet.
   */
  getSheetSources: () => {
    const sources = new Map<
      string,
      { spreadsheetId: string; credentialId: string; range?: string }
    >();

    get().nodes.forEach((node) => {
      const isSheetNode =
        node.data.kind === "google_sheets_read" ||
        node.data.kind === "google_sheets_trigger" ||
        node.data.kind === "google_sheets_update" ||
        node.data.kind === "google_sheets_append";

      const spreadsheetId = String(node.data.config?.spreadsheetId ?? "").trim();
      const credentialId = node.data.credentialId ?? "";

      if (isSheetNode && spreadsheetId && credentialId) {
        sources.set(spreadsheetId, {
          spreadsheetId,
          credentialId,
          range: node.data.config?.range
            ? String(node.data.config.range)
            : undefined,
        });
      }
    });

    return Array.from(sources.values());
  },

  saveWorkflow: async () => {
    const { workflowId, name, nodes, edges, isPublished } = get();

    if (!workflowId) {
      return;
    }

    set({ isSaving: true, errorMessage: null });

    try {
      const updatedWorkflow = await workflowService.update(workflowId, {
        name,
        nodes,
        edges,
        isPublished,
      });

      set(applyWorkflow(updatedWorkflow));
    } catch {
      set({ errorMessage: "Gagal menyimpan workflow." });
    } finally {
      set({ isSaving: false });
    }
  },

  executeWorkflow: async () => {
    const { workflowId, isDirty, saveWorkflow } = get();

    if (!workflowId) {
      return;
    }

    set({ isExecuting: true, errorMessage: null });

    try {
      if (isDirty) {
        await saveWorkflow();
      }

      const { executionId } = await workflowService.execute(workflowId);
      set({ lastExecutionId: executionId });
    } catch {
      set({ errorMessage: "Gagal menjalankan workflow." });
    } finally {
      set({ isExecuting: false });
    }
  },

  reset: () =>
    set({
      workflowId: null,
      name: "",
      nodes: [],
      edges: [],
      isPublished: false,
      isDirty: false,
      isLoading: false,
      isSaving: false,
      isExecuting: false,
      errorMessage: null,
      lastExecutionId: null,
    }),
}));
