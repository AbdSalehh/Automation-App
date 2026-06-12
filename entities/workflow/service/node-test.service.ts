import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";
import type { FlowNode } from "../model/workflow.model";

export interface NodeTestResult {
  ok: boolean;
  output?: unknown;
  error?: string;
}

export const nodeTestService = {
  run: async (params: {
    workflowId: string;
    node: FlowNode;
    sampleInput?: unknown;
  }): Promise<NodeTestResult> => {
    const { data: response } = await apiClient.post<
      ApiResponse<NodeTestResult>
    >("/workflows/test-node", params);

    return response.data;
  },
};
