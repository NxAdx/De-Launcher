/**
 * Settings Store — Zustand + MMKV
 *
 * Persists user preferences: theme, grid, labels, etc.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "./storage";
import { ThemeMode } from "@/src/theme/tokens";

interface SettingsState {
  theme: ThemeMode;
  gridColumns: number;
  showLabels: boolean;
  showClock: boolean;
  hapticFeedback: boolean;
  activeIconPack: string | null; // packageName of selected icon pack
  hasCompletedOnboarding: boolean;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setGridColumns: (cols: number) => void;
  setShowLabels: (show: boolean) => void;
  setShowClock: (show: boolean) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setActiveIconPack: (packageName: string | null) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      theme: "dark",
      gridColumns: 4,
      showLabels: true,
      showClock: true,
      hapticFeedback: true,
      activeIconPack: null,
      hasCompletedOnboarding: false,

      // Actions
      setTheme: (theme) => set({ theme }),
      setGridColumns: (gridColumns) => set({ gridColumns }),
      setShowLabels: (showLabels) => set({ showLabels }),
      setShowClock: (showClock) => set({ showClock }),
      setHapticFeedback: (hapticFeedback) => set({ hapticFeedback }),
      setActiveIconPack: (activeIconPack) => set({ activeIconPack }),
      setHasCompletedOnboarding: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
    }),
    {
      name: "settings-store",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
