import { create } from "zustand";
import { metricsService } from "../service/metrics.service";
import type {
  DashboardMetrics,
  WorkflowMetricsData,
} from "../model/metrics.model";

/**
 * Metrics store. Per coding rule #6, fetching dan loading state untuk metrik
 * dashboard maupun per-workflow dikelola di sini, bukan di komponen.
 */
interface MetricsState {
  dashboard: DashboardMetrics | null;
  workflowMetrics: Record<string, WorkflowMetricsData>;
  isLoadingDashboard: boolean;
  isLoadingWorkflow: boolean;
  errorMessage: string | null;

  fetchDashboardMetrics: () => Promise<void>;
  fetchWorkflowMetrics: (workflowId: string) => Promise<void>;
}

export const useMetricsStore = create<MetricsState>((set) => ({
  dashboard: null,
  workflowMetrics: {},
  isLoadingDashboard: false,
  isLoadingWorkflow: false,
  errorMessage: null,

  fetchDashboardMetrics: async () => {
    set({ isLoadingDashboard: true, errorMessage: null });

    try {
      const dashboard = await metricsService.dashboard();
      set({ dashboard });
    } catch {
      set({ errorMessage: "Failed to load dashboard metrics." });
    } finally {
      set({ isLoadingDashboard: false });
    }
  },

  fetchWorkflowMetrics: async (workflowId) => {
    set({ isLoadingWorkflow: true, errorMessage: null });

    try {
      const metrics = await metricsService.workflow(workflowId);

      set((state) => ({
        workflowMetrics: {
          ...state.workflowMetrics,
          [workflowId]: metrics,
        },
      }));
    } catch {
      set({ errorMessage: "Failed to load workflow metrics." });
    } finally {
      set({ isLoadingWorkflow: false });
    }
  },
}));
