import { create } from "zustand";
import {
  sheetColumnsService,
  type SheetColumnsResult,
} from "../service/sheet-columns.service";

/**
 * Caches spreadsheet headers and distinct values per spreadsheet id so multiple
 * nodes in the editor can reuse them. Per coding rule #6, the API call and
 * loading/error state live here rather than in components.
 */
interface SheetColumnsState {
  /** spreadsheetId -> { headers, valuesByColumn } */
  dataBySpreadsheet: Record<string, SheetColumnsResult>;
  isLoading: boolean;
  errorMessage: string | null;

  fetchColumns: (params: {
    credentialId: string;
    spreadsheetId: string;
    sheetName?: string;
    force?: boolean;
  }) => Promise<void>;

  clearCache: () => void;
  getColumns: (spreadsheetId: string) => string[];
  getColumnValues: (spreadsheetId: string, column: string) => string[];
}

export const useSheetColumnsStore = create<SheetColumnsState>((set, get) => ({
  dataBySpreadsheet: {},
  isLoading: false,
  errorMessage: null,

  fetchColumns: async ({
    credentialId,
    spreadsheetId,
    sheetName,
    force = false,
  }) => {
    if (!credentialId || !spreadsheetId) {
      return;
    }

    const alreadyCached = Boolean(get().dataBySpreadsheet[spreadsheetId]);

    if (alreadyCached && !force) {
      return;
    }

    set({ isLoading: true, errorMessage: null });

    try {
      const result = await sheetColumnsService.fetch({
        credentialId,
        spreadsheetId,
        sheetName,
      });

      set((state) => ({
        dataBySpreadsheet: {
          ...state.dataBySpreadsheet,
          [spreadsheetId]: result,
        },
      }));
    } catch {
      set({ errorMessage: "Failed to fetch columns from the spreadsheet." });
    } finally {
      set({ isLoading: false });
    }
  },

  clearCache: () => set({ dataBySpreadsheet: {} }),

  getColumns: (spreadsheetId) =>
    get().dataBySpreadsheet[spreadsheetId]?.headers ?? [],

  getColumnValues: (spreadsheetId, column) =>
    get().dataBySpreadsheet[spreadsheetId]?.valuesByColumn?.[column] ?? [],
}));
