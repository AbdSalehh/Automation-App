import { apiClient } from "@/shared/api/apiClient";
import { API_ROUTES } from "@/shared/config/constants";
import type { ApiResponse } from "@/shared/api/http";
import type { UserSetting } from "../model/user-setting.model";

export const userSettingService = {
  get: async (): Promise<UserSetting> => {
    const { data: response } = await apiClient.get<ApiResponse<UserSetting>>(
      API_ROUTES.settings,
    );

    return response.data;
  },

  update: async (payload: UserSetting): Promise<UserSetting> => {
    const { data: response } = await apiClient.put<ApiResponse<UserSetting>>(
      API_ROUTES.settings,
      payload,
    );

    return response.data;
  },
};
