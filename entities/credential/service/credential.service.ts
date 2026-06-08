import { apiClient } from "@/shared/api/apiClient";
import { API_ROUTES } from "@/shared/config/constants";
import type { ApiResponse, PaginatedApiResponse } from "@/shared/api/http";
import type {
  Credential,
  CreateCredentialPayload,
} from "../model/credential.model";

export const credentialService = {
  list: async (): Promise<Credential[]> => {
    const { data: response } = await apiClient.get<
      PaginatedApiResponse<Credential>
    >(API_ROUTES.credentials);

    return response.data;
  },

  create: async (payload: CreateCredentialPayload): Promise<Credential> => {
    const { data: response } = await apiClient.post<ApiResponse<Credential>>(
      API_ROUTES.credentials,
      payload,
    );

    return response.data;
  },

  remove: async (credentialId: string): Promise<void> => {
    await apiClient.delete(API_ROUTES.credential(credentialId));
  },

  test: async (
    payload: CreateCredentialPayload,
  ): Promise<{ ok: boolean; message: string }> => {
    const { data: response } = await apiClient.post<
      ApiResponse<{ connected: boolean }>
    >(API_ROUTES.testConnector, payload);

    return { ok: response.data.connected, message: response.message };
  },
};
