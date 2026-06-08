import { create } from "zustand";
import { executionService } from "../service/execution.service";
import type { Execution, ExecutionDetail } from "../model/execution.model";

/**
 * Execution store. Per coding rule #6, fetching and loading state for
 * executions and their details are owned here.
 */
interface ExecutionState {
  executions: Execution[];
  selectedDetail: ExecutionDetail | null;
  isLoading: boolean;
  isLoadingDetail: boolean;
  errorMessage: string | null;

  fetchExecutions: (workflowId?: string) => Promise<void>;
  fetchExecutionDetail: (executionId: string) => Promise<void>;
  clearDetail: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  executions: [],
  selectedDetail: null,
  isLoading: false,
  isLoadingDetail: false,
  errorMessage: null,

  fetchExecutions: async (workflowId) => {
    set({ isLoading: true, errorMessage: null });

    try {
      const executions = await executionService.list(workflowId);
      set({ executions });
    } catch {
      set({ errorMessage: "Gagal memuat eksekusi." });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchExecutionDetail: async (executionId) => {
    set({ isLoadingDetail: true, selectedDetail: null });

    try {
      const detail = await executionService.getById(executionId);
      set({ selectedDetail: detail });
    } catch {
      set({ errorMessage: "Gagal memuat detail eksekusi." });
    } finally {
      set({ isLoadingDetail: false });
    }
  },

  clearDetail: () => set({ selectedDetail: null }),
}));
