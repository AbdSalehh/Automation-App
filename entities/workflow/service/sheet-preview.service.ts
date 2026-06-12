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

  /**
   * Fetches a few real rows as objects keyed by header, used to seed the
   * per-node Test Run with authentic data instead of placeholder values.
   */
  fetchRows: async (params: {
    credentialId: string;
    spreadsheetId: string;
    sheetName?: string;
    limit?: number;
  }): Promise<Record<string, string>[]> => {
    const result = await sheetPreviewService.fetch(params);

    return result.rows.map((row) => {
      const rowObject: Record<string, string> = {};

      result.headers.forEach((header, columnIndex) => {
        rowObject[header] = row[columnIndex] ?? "";
      });

      return rowObject;
    });
  },
};
