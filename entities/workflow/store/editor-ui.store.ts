import { create } from "zustand";

interface EditorUiState {
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  setSettingsOpen: (isSettingsOpen: boolean) => void;
}

/**
 * Store UI ringan untuk editor workflow. Memisahkan state buka/tutup panel
 * Setelan agar bisa dikontrol lintas komponen (header & kanvas) tanpa prop
 * drilling.
 */
export const useEditorUiStore = create<EditorUiState>((set) => ({
  isSettingsOpen: false,
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
}));
