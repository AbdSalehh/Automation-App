import { apiClient } from "@/shared/api/apiClient";
import { API_ROUTES } from "@/shared/config/constants";
import type { ApiResponse } from "@/shared/api/http";
import type { SearchResults } from "../model/search.model";

export const searchService = {
  query: async (term: string): Promise<SearchResults> => {
    const { data: response } = await apiClient.get<ApiResponse<SearchResults>>(
      API_ROUTES.search,
      { params: { q: term } },
    );

    return response.data;
  },
};
