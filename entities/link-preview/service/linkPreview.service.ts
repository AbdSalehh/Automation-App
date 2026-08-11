import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";
import type { LinkPreviewMetadata } from "../model/linkPreview.model";

export const linkPreviewService = {
  get: async (url: string): Promise<LinkPreviewMetadata> => {
    const { data: response } = await apiClient.get<
      ApiResponse<LinkPreviewMetadata>
    >("/link-preview", {
      params: { url },
    });

    return response.data;
  },
};
