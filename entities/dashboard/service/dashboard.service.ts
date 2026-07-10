import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";
import type { DashboardRow } from "../model/dashboard.model";

interface SheetPreviewResult {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

export const dashboardService = {
  fetchRows: async (params: {
    credentialId: string;
    spreadsheetId: string;
    sheetName?: string;
    limit?: number;
  }): Promise<DashboardRow[]> => {
    const { data: response } = await apiClient.post<
      ApiResponse<SheetPreviewResult>
    >("/connectors/sheets/preview", params);

    return response.data.rows.map((row) => {
      const rowObject: DashboardRow = {};

      response.data.headers.forEach((header, columnIndex) => {
        rowObject[header] = row[columnIndex] ?? "";
      });

      return rowObject;
    });
  },
};
