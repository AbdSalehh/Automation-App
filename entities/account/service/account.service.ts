import { apiClient } from "@/shared/api/apiClient";
import { API_ROUTES } from "@/shared/config/constants";
import type { ApiResponse } from "@/shared/api/http";
import type {
  UpdateProfilePayload,
  UpdatedProfile,
  ChangePasswordPayload,
} from "../model/account.model";

export const accountService = {
  updateProfile: async (
    payload: UpdateProfilePayload,
  ): Promise<UpdatedProfile> => {
    const { data: response } = await apiClient.patch<
      ApiResponse<UpdatedProfile>
    >(API_ROUTES.accountProfile, payload);

    return response.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await apiClient.patch<ApiResponse<{ updated: boolean }>>(
      API_ROUTES.accountPassword,
      payload,
    );
  },
};
