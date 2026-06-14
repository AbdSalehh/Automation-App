import { apiClient } from "@/shared/api/apiClient";
import { API_ROUTES } from "@/shared/config/constants";
import type { ApiResponse, PaginatedApiResponse } from "@/shared/api/http";
import type {
  Execution,
  ExecutionDetail,
  InboundReply,
} from "../model/execution.model";

export interface InboundRepliesResponse {
  replies: InboundReply[];
  serverTime: string;
}

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
    const { data: response } = await apiClient.get<
      ApiResponse<ExecutionDetail>
    >(`${API_ROUTES.executions}/${executionId}`);

    return response.data;
  },

  /**
   * Mengambil balasan WhatsApp masuk untuk sebuah workflow sejak `since` (ISO),
   * dipakai editor untuk memunculkan toast saat workflow berjalan.
   */
  listReplies: async (
    workflowId: string,
    since?: string,
  ): Promise<InboundRepliesResponse> => {
    const { data: response } = await apiClient.get<
      ApiResponse<InboundRepliesResponse>
    >(`${API_ROUTES.workflow(workflowId)}/replies`, {
      params: since ? { since } : undefined,
    });

    return response.data;
  },
};
