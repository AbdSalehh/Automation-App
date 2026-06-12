import { create } from "zustand";
import { executionService } from "../service/execution.service";
import type {
  Execution,
  ExecutionDetail,
  ExecutionStatus,
} from "../model/execution.model";

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

  /** Status of the most recent execution, used to animate running edges. */
  latestStatus: ExecutionStatus | null;

  fetchExecutions: (workflowId?: string) => Promise<void>;
  fetchExecutionDetail: (executionId: string) => Promise<void>;
  pollLatestStatus: (workflowId: string) => Promise<void>;
  clearDetail: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  executions: [],
  selectedDetail: null,
  isLoading: false,
  isLoadingDetail: false,
  errorMessage: null,
  latestStatus: null,

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

  /**
   * Fetches the most recent execution and stores its status. Intended to be
   * polled by the editor so edges can animate while a run is in progress.
   */
  pollLatestStatus: async (workflowId) => {
    try {
      const executions = await executionService.list(workflowId);
      const latest = executions[0] ?? null;

      set({ latestStatus: latest ? latest.status : null });
    } catch {
      set({ latestStatus: null });
    }
  },

  clearDetail: () => set({ selectedDetail: null }),
}));
