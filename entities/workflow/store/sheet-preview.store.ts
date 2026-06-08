import { create } from "zustand";
import { apiClient } from "@/shared/api/apiClient";
import {
  sheetPreviewService,
  type SheetPreviewResult,
} from "../service/sheet-preview.service";
import type { ApiResponse } from "@/shared/api/http";

interface SheetListResponse {
  sheets: string[];
}

interface SheetPreviewState {
  data: SheetPreviewResult | null;
  isLoading: boolean;
  errorMessage: string | null;
  isOpen: boolean;
  sheetList: string[];
  activeSheet: string;
  /** Stored so switching tabs can re-fetch without re-passing params. */
  lastParams: { credentialId: string; spreadsheetId: string } | null;

  fetchPreview: (params: {
    credentialId: string;
    spreadsheetId: string;
    sheetName?: string;
  }) => Promise<void>;

  fetchSheetList: (params: {
    credentialId: string;
    spreadsheetId: string;
  }) => Promise<void>;

  setActiveSheet: (sheetName: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  clearPreview: () => void;
}

export const useSheetPreviewStore = create<SheetPreviewState>((set, get) => ({
  data: null,
  isLoading: false,
  errorMessage: null,
  isOpen: false,
  sheetList: [],
  activeSheet: "",
  lastParams: null,

  fetchPreview: async ({ credentialId, spreadsheetId, sheetName }) => {
    if (!credentialId || !spreadsheetId) {
      return;
    }

    set({ isLoading: true, errorMessage: null, isOpen: true });

    try {
      const result = await sheetPreviewService.fetch({
        credentialId,
        spreadsheetId,
        sheetName,
      });

      set({ data: result });
    } catch {
      set({ errorMessage: "Gagal mengambil data preview dari spreadsheet." });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSheetList: async ({ credentialId, spreadsheetId }) => {
    if (!credentialId || !spreadsheetId) {
      return;
    }

    try {
      const { data: response } = await apiClient.post<
        ApiResponse<SheetListResponse>
      >("/connectors/sheets/sheets", { credentialId, spreadsheetId });

      const sheets = response.data?.sheets ?? [];
      const firstSheet = sheets[0] ?? "";

      set({
        sheetList: sheets,
        activeSheet: firstSheet,
        lastParams: { credentialId, spreadsheetId },
      });
    } catch {
      set({ sheetList: [], activeSheet: "" });
    }
  },

  setActiveSheet: (sheetName) => {
    const { lastParams, fetchPreview } = get();

    set({ activeSheet: sheetName, data: null });

    if (lastParams) {
      fetchPreview({ ...lastParams, sheetName });
    }
  },

  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  clearPreview: () =>
    set({
      data: null,
      errorMessage: null,
      isOpen: false,
      sheetList: [],
      activeSheet: "",
      lastParams: null,
    }),
}));
