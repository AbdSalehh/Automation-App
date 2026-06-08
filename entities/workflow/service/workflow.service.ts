import { apiClient } from "@/shared/api/apiClient";
import { API_ROUTES } from "@/shared/config/constants";
import type { ApiResponse, PaginatedApiResponse } from "@/shared/api/http";
import type {
  Workflow,
  WorkflowSummary,
  CreateWorkflowPayload,
  UpdateWorkflowPayload,
} from "../model/workflow.model";

export const workflowService = {
  list: async (): Promise<WorkflowSummary[]> => {
    const { data: response } = await apiClient.get<
      PaginatedApiResponse<WorkflowSummary>
    >(API_ROUTES.workflows);

    return response.data;
  },

  getById: async (workflowId: string): Promise<Workflow> => {
    const { data: response } = await apiClient.get<ApiResponse<Workflow>>(
      API_ROUTES.workflow(workflowId),
    );

    return response.data;
  },

  create: async (payload: CreateWorkflowPayload): Promise<Workflow> => {
    const { data: response } = await apiClient.post<ApiResponse<Workflow>>(
      API_ROUTES.workflows,
      payload,
    );

    return response.data;
  },

  update: async (
    workflowId: string,
    payload: UpdateWorkflowPayload,
  ): Promise<Workflow> => {
    const { data: response } = await apiClient.put<ApiResponse<Workflow>>(
      API_ROUTES.workflow(workflowId),
      payload,
    );

    return response.data;
  },

  remove: async (workflowId: string): Promise<void> => {
    await apiClient.delete(API_ROUTES.workflow(workflowId));
  },

  execute: async (workflowId: string): Promise<{ executionId: string }> => {
    const { data: response } = await apiClient.post<
      ApiResponse<{ executionId: string }>
    >(API_ROUTES.executeWorkflow(workflowId));

    return response.data;
  },
};
