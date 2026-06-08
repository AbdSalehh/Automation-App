import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";

export interface SheetPreviewResult {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

export const sheetPreviewService = {
  fetch: async (params: {
    credentialId: string;
    spreadsheetId: string;
    sheetName?: string;
    limit?: number;
  }): Promise<SheetPreviewResult> => {
    const { data: response } = await apiClient.post<
      ApiResponse<SheetPreviewResult>
    >("/connectors/sheets/preview", params);

    return response.data;
  },
};
