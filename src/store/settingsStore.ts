/**
 * Settings Store — Zustand + MMKV
 *
 * Persists user preferences: theme, grid, labels, widgets, dock styling, etc.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "./storage";
import { ThemeMode } from "@/src/theme/tokens";
import { useAppStore } from "./appStore";
import { batchLoadMonochromeIcons } from "../services/appManager";

export type SearchWidgetStyle = "pill" | "rounded" | "minimal";
export type DockBackgroundStyle = "transparent" | "frosted";
export type IconSizeOption = "small" | "medium" | "large";
export type IconThemeOption = "standard" | "monochrome";

interface SettingsState {
  theme: ThemeMode;
  gridColumns: number;
  showLabels: boolean;
  showClock: boolean;
  hapticFeedback: boolean;
  activeIconPack: string | null; // packageName of selected icon pack
  iconTheme: IconThemeOption;
  hasCompletedOnboarding: boolean;

  // Search Widget Options
  showHomeSearchWidget: boolean;
  searchWidgetStyle: SearchWidgetStyle;

  // Dock Options
  dockBackground: DockBackgroundStyle;
  maxDockIcons: number;

  // Todo / Streak Options
  showTodoWidget: boolean;

  // Digital Wellbeing & Morning Focus
  showScreenTimeWidget: boolean;
  screenTimeGoalMs: number; // default: 2 hours (7,200,000 ms)
  morningPromptEnabled: boolean;
  morningPromptTime: string; // "07:00"

  // Icon Sizing
  iconSize: IconSizeOption;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setGridColumns: (cols: number) => void;
  setShowLabels: (show: boolean) => void;
  setShowClock: (show: boolean) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setActiveIconPack: (packageName: string | null) => void;
  setIconTheme: (iconTheme: IconThemeOption) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setShowHomeSearchWidget: (show: boolean) => void;
  setSearchWidgetStyle: (style: SearchWidgetStyle) => void;
  setDockBackground: (bg: DockBackgroundStyle) => void;
  setMaxDockIcons: (max: number) => void;
  setShowTodoWidget: (show: boolean) => void;
  setShowScreenTimeWidget: (show: boolean) => void;
  setScreenTimeGoalMs: (goalMs: number) => void;
  setMorningPromptEnabled: (enabled: boolean) => void;
  setMorningPromptTime: (time: string) => void;
  setIconSize: (size: IconSizeOption) => void;
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
      iconTheme: "standard",
      hasCompletedOnboarding: false,

      showHomeSearchWidget: true,
      searchWidgetStyle: "pill",

      dockBackground: "frosted",
      maxDockIcons: 6,

      showTodoWidget: true,
      showScreenTimeWidget: false,
      screenTimeGoalMs: 2 * 60 * 60 * 1000, // 2 hours
      morningPromptEnabled: true,
      morningPromptTime: "07:00",

      iconSize: "medium",

      // Actions
      setTheme: (theme) => set({ theme }),
      setGridColumns: (gridColumns) => set({ gridColumns }),
      setShowLabels: (showLabels) => set({ showLabels }),
      setShowClock: (showClock) => set({ showClock }),
      setHapticFeedback: (hapticFeedback) => set({ hapticFeedback }),
      setActiveIconPack: (activeIconPack) => set({ activeIconPack }),
      setIconTheme: (iconTheme) => {
        set({ iconTheme });
        if (iconTheme === "monochrome") {
          try {
            const apps = useAppStore.getState().installedApps || [];
            const missingPkgs = apps.filter((a) => !a.monoIcon).map((a) => a.packageName);
            if (missingPkgs.length > 0) {
              batchLoadMonochromeIcons(missingPkgs).catch(() => {});
            }
          } catch {
            // safely handled
          }
        }
      },
      setHasCompletedOnboarding: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
      setShowHomeSearchWidget: (showHomeSearchWidget) => set({ showHomeSearchWidget }),
      setSearchWidgetStyle: (searchWidgetStyle) => set({ searchWidgetStyle }),
      setDockBackground: (dockBackground) => set({ dockBackground }),
      setMaxDockIcons: (maxDockIcons) => set({ maxDockIcons: Math.max(4, Math.min(6, maxDockIcons)) }),
      setShowTodoWidget: (showTodoWidget) => set({ showTodoWidget }),
      setShowScreenTimeWidget: (showScreenTimeWidget) => set({ showScreenTimeWidget }),
      setScreenTimeGoalMs: (screenTimeGoalMs) => set({ screenTimeGoalMs }),
      setMorningPromptEnabled: (morningPromptEnabled) => set({ morningPromptEnabled }),
      setMorningPromptTime: (morningPromptTime) => set({ morningPromptTime }),
      setIconSize: (iconSize) => set({ iconSize }),
    }),
    {
      name: "settings-store",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
