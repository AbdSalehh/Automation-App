import { apiClient } from "@/shared/api/apiClient";
import { API_ROUTES } from "@/shared/config/constants";
import type {
  ApiResponse,
  PaginatedApiResponse,
  PaginationMeta,
} from "@/shared/api/http";
import type {
  ManagedUser,
  CreateUserPayload,
  ListUsersParams,
} from "../model/managed-user.model";

/**
 * Service untuk pengelolaan user oleh admin. Mengikuti aturan double-unwrap
 * envelope: `data: response` lalu `response.data` untuk nilai sebenarnya.
 */
export const managedUserService = {
  list: async (
    params: ListUsersParams,
  ): Promise<{ users: ManagedUser[]; metadata: PaginationMeta }> => {
    const { data: response } = await apiClient.get<
      PaginatedApiResponse<ManagedUser>
    >(API_ROUTES.users, {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search || undefined,
        role: params.role !== "all" ? params.role : undefined,
        status: params.status !== "all" ? params.status : undefined,
      },
    });

    return { users: response.data, metadata: response.metadata };
  },

  create: async (payload: CreateUserPayload): Promise<ManagedUser> => {
    const { data: response } = await apiClient.post<ApiResponse<ManagedUser>>(
      API_ROUTES.users,
      payload,
    );

    return response.data;
  },

  resetPassword: async (
    userId: string,
    password: string,
  ): Promise<ManagedUser> => {
    const { data: response } = await apiClient.patch<ApiResponse<ManagedUser>>(
      API_ROUTES.user(userId),
      { action: "reset-password", password },
    );

    return response.data;
  },

  approve: async (userId: string): Promise<ManagedUser> => {
    const { data: response } = await apiClient.patch<ApiResponse<ManagedUser>>(
      API_ROUTES.user(userId),
      { action: "approve" },
    );

    return response.data;
  },

  reject: async (userId: string): Promise<ManagedUser> => {
    const { data: response } = await apiClient.patch<ApiResponse<ManagedUser>>(
      API_ROUTES.user(userId),
      { action: "reject" },
    );

    return response.data;
  },

  unlock: async (userId: string): Promise<ManagedUser> => {
    const { data: response } = await apiClient.patch<ApiResponse<ManagedUser>>(
      API_ROUTES.user(userId),
      { action: "unlock" },
    );

    return response.data;
  },

  setActive: async (
    userId: string,
    isActive: boolean,
  ): Promise<ManagedUser> => {
    const { data: response } = await apiClient.patch<ApiResponse<ManagedUser>>(
      API_ROUTES.user(userId),
      { action: isActive ? "activate" : "deactivate" },
    );

    return response.data;
  },

  remove: async (userId: string): Promise<void> => {
    await apiClient.delete(API_ROUTES.user(userId));
  },
};
