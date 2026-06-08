import { create } from "zustand";
import { workflowService } from "../service/workflow.service";
import type { WorkflowSummary } from "../model/workflow.model";

/**
 * Store for the workflow list page. Per coding rule #6, fetching and loading
 * state are owned here, not in the list component.
 */
interface WorkflowListState {
  workflows: WorkflowSummary[];
  isLoading: boolean;
  isCreating: boolean;
  errorMessage: string | null;

  fetchWorkflows: () => Promise<void>;
  createWorkflow: (name: string) => Promise<string | null>;
  removeWorkflow: (workflowId: string) => Promise<void>;
}

export const useWorkflowListStore = create<WorkflowListState>((set) => ({
  workflows: [],
  isLoading: false,
  isCreating: false,
  errorMessage: null,

  fetchWorkflows: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const workflows = await workflowService.list();
      set({ workflows });
    } catch {
      set({ errorMessage: "Gagal memuat workflow." });
    } finally {
      set({ isLoading: false });
    }
  },

  createWorkflow: async (name) => {
    set({ isCreating: true, errorMessage: null });

    try {
      const createdWorkflow = await workflowService.create({ name });
      set((state) => ({
        workflows: [
          {
            id: createdWorkflow.id,
            name: createdWorkflow.name,
            version: createdWorkflow.version,
            isPublished: createdWorkflow.isPublished,
            updatedAt: createdWorkflow.updatedAt,
            nodeCount: createdWorkflow.nodes.length,
          },
          ...state.workflows,
        ],
      }));

      return createdWorkflow.id;
    } catch {
      set({ errorMessage: "Gagal membuat workflow." });

      return null;
    } finally {
      set({ isCreating: false });
    }
  },

  removeWorkflow: async (workflowId) => {
    await workflowService.remove(workflowId);
    set((state) => ({
      workflows: state.workflows.filter(
        (workflow) => workflow.id !== workflowId,
      ),
    }));
  },
}));
