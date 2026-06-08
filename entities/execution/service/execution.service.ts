import { apiClient } from "@/shared/api/apiClient";
import { API_ROUTES } from "@/shared/config/constants";
import type { ApiResponse, PaginatedApiResponse } from "@/shared/api/http";
import type { Execution, ExecutionDetail } from "../model/execution.model";

export const executionService = {
  list: async (workflowId?: string): Promise<Execution[]> => {
    const { data: response } = await apiClient.get<
      PaginatedApiResponse<Execution>
    >(API_ROUTES.executions, {
      params: workflowId ? { workflowId } : undefined,
    });

    return response.data;
  },

  getById: async (executionId: string): Promise<ExecutionDetail> => {
    const { data: response } = await apiClient.get<ApiResponse<ExecutionDetail>>(
      `${API_ROUTES.executions}/${executionId}`,
    );

    return response.data;
  },
};
