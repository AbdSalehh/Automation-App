import { create } from "zustand";

import type { LinkPreviewMetadata } from "../model/linkPreview.model";
import { linkPreviewService } from "../service/linkPreview.service";

interface LinkPreviewState {
  metadataByUrl: Record<string, LinkPreviewMetadata | null>;
  loadingByUrl: Record<string, boolean>;
  loadPreview: (url: string) => Promise<void>;
}

export const useLinkPreviewStore = create<LinkPreviewState>((set, get) => ({
  metadataByUrl: {},
  loadingByUrl: {},
  loadPreview: async (url) => {
    const { metadataByUrl, loadingByUrl } = get();

    if (url in metadataByUrl || loadingByUrl[url]) {
      return;
    }

    set((state) => ({
      loadingByUrl: { ...state.loadingByUrl, [url]: true },
    }));

    try {
      const metadata = await linkPreviewService.get(url);

      set((state) => ({
        metadataByUrl: { ...state.metadataByUrl, [url]: metadata },
      }));
    } catch {
      set((state) => ({
        metadataByUrl: { ...state.metadataByUrl, [url]: null },
      }));
    } finally {
      set((state) => ({
        loadingByUrl: { ...state.loadingByUrl, [url]: false },
      }));
    }
  },
}));
