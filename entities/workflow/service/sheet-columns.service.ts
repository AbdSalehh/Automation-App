import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";

export interface SheetColumnsResult {
  headers: string[];
  valuesByColumn: Record<string, string[]>;
}

/**
 * Fetches the real header row and distinct values of a spreadsheet so the
 * editor can offer accurate column choices and value dropdowns instead of
 * relying on manually-typed names.
 */
export const sheetColumnsService = {
  fetch: async (params: {
    credentialId: string;
    spreadsheetId: string;
    sheetName?: string;
  }): Promise<SheetColumnsResult> => {
    const { data: response } = await apiClient.post<
      ApiResponse<SheetColumnsResult>
    >("/connectors/sheets/columns", params);

    return response.data;
  },
};
