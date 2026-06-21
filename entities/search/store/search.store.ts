import { create } from "zustand";
import { searchService } from "../service/search.service";
import {
  EMPTY_SEARCH_RESULTS,
  type SearchResults,
} from "../model/search.model";

interface SearchState {
  term: string;
  results: SearchResults;
  isSearching: boolean;

  setTerm: (term: string) => void;
  runSearch: (term: string) => Promise<void>;
  resetSearch: () => void;
}

/**
 * Store pencarian global untuk command palette. Menyimpan kueri, hasil, dan
 * status loading. Debounce dilakukan di komponen agar store tetap sederhana.
 */
export const useSearchStore = create<SearchState>((set) => ({
  term: "",
  results: EMPTY_SEARCH_RESULTS,
  isSearching: false,

  setTerm: (term) => set({ term }),

  runSearch: async (term) => {
    const trimmedTerm = term.trim();

    if (!trimmedTerm) {
      set({ results: EMPTY_SEARCH_RESULTS, isSearching: false });
      return;
    }

    set({ isSearching: true });

    try {
      const results = await searchService.query(trimmedTerm);
      set({ results });
    } catch {
      set({ results: EMPTY_SEARCH_RESULTS });
    } finally {
      set({ isSearching: false });
    }
  },

  resetSearch: () =>
    set({ term: "", results: EMPTY_SEARCH_RESULTS, isSearching: false }),
}));
