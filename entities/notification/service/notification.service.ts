import { apiClient } from "@/shared/api/apiClient";
import { API_ROUTES } from "@/shared/config/constants";
import type { ApiResponse, PaginatedApiResponse } from "@/shared/api/http";
import type { AppNotification } from "../model/notification.model";

export const notificationService = {
  list: async (): Promise<AppNotification[]> => {
    const { data: response } = await apiClient.get<
      PaginatedApiResponse<AppNotification>
    >(API_ROUTES.notifications);

    return response.data;
  },

  markRead: async (notificationId: string): Promise<void> => {
    await apiClient.patch<ApiResponse<null>>(
      API_ROUTES.notificationRead(notificationId),
    );
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.patch<ApiResponse<null>>(API_ROUTES.notificationsReadAll);
  },
};
