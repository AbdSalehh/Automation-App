import { apiClient } from "@/shared/api/apiClient";
import { API_ROUTES } from "@/shared/config/constants";
import type { ApiResponse } from "@/shared/api/http";
import type {
  DashboardMetrics,
  WorkflowMetricsData,
} from "../model/metrics.model";

export const metricsService = {
  dashboard: async (): Promise<DashboardMetrics> => {
    const { data: response } = await apiClient.get<
      ApiResponse<DashboardMetrics>
    >(API_ROUTES.metricsDashboard);

    return response.data;
  },

  workflow: async (workflowId: string): Promise<WorkflowMetricsData> => {
    const { data: response } = await apiClient.get<
      ApiResponse<WorkflowMetricsData>
    >(API_ROUTES.metricsWorkflow(workflowId));

    return response.data;
  },
};
