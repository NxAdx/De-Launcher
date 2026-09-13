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
import { setReturnHomeConfig } from "../../modules/de-launcher-native";

export type SearchWidgetStyle = "pill" | "rounded" | "minimal";
export type DockBackgroundStyle = "transparent" | "frosted";
export type IconSizeOption = "small" | "medium" | "large";
export type IconThemeOption = "standard" | "monochrome";
export type SwipeDownAction = "search" | "notifications";
export type HomeDisplayMode = "icons" | "text";

interface SettingsState {
  theme: ThemeMode;
  gridColumns: number;
  showLabels: boolean;
  showClock: boolean;
  hapticFeedback: boolean;
  activeIconPack: string | null; // packageName of selected icon pack
  iconTheme: IconThemeOption;
  hasCompletedOnboarding: boolean;

  // Gestures
  doubleTapToLock: boolean;
  swipeDownAction: SwipeDownAction;

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

  // Icon Sizing & Display Mode
  iconSize: IconSizeOption;
  homeDisplayMode: HomeDisplayMode;

  // Distraction Shield & Focus Features
  returnHomeAfterLock: boolean;
  returnHomeTimeoutMinutes: number;
  mindfulBreathingGate: boolean;
  deepHideDistractionsInDrawer: boolean;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setGridColumns: (cols: number) => void;
  setShowLabels: (show: boolean) => void;
  setShowClock: (show: boolean) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setActiveIconPack: (packageName: string | null) => void;
  setIconTheme: (iconTheme: IconThemeOption) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setDoubleTapToLock: (enabled: boolean) => void;
  setSwipeDownAction: (action: SwipeDownAction) => void;
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
  setHomeDisplayMode: (mode: HomeDisplayMode) => void;
  setReturnHomeAfterLock: (enabled: boolean) => void;
  setReturnHomeTimeoutMinutes: (minutes: number) => void;
  setMindfulBreathingGate: (enabled: boolean) => void;
  setDeepHideDistractionsInDrawer: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Defaults
      theme: "dark",
      gridColumns: 4,
      showLabels: true,
      showClock: true,
      hapticFeedback: true,
      activeIconPack: null,
      iconTheme: "standard",
      hasCompletedOnboarding: false,

      doubleTapToLock: true,
      swipeDownAction: "search",

      showHomeSearchWidget: true,
      searchWidgetStyle: "pill",

      dockBackground: "frosted",
      maxDockIcons: 6,

      showTodoWidget: true,
      showScreenTimeWidget: false,
      screenTimeGoalMs: 2 * 60 * 60 * 1000, // 2 hours
      morningPromptEnabled: false, // Default false: no unexpected unlock popups
      morningPromptTime: "07:00",

      iconSize: "medium",
      homeDisplayMode: "icons",

      returnHomeAfterLock: true,
      returnHomeTimeoutMinutes: 5,
      mindfulBreathingGate: true,
      deepHideDistractionsInDrawer: false,

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
      setDoubleTapToLock: (doubleTapToLock) => set({ doubleTapToLock }),
      setSwipeDownAction: (swipeDownAction) => set({ swipeDownAction }),
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
      setHomeDisplayMode: (homeDisplayMode) => set({ homeDisplayMode }),
      setReturnHomeAfterLock: (returnHomeAfterLock) => {
        set({ returnHomeAfterLock });
        setReturnHomeConfig(returnHomeAfterLock, get().returnHomeTimeoutMinutes).catch(console.error);
      },
      setReturnHomeTimeoutMinutes: (returnHomeTimeoutMinutes) => {
        set({ returnHomeTimeoutMinutes });
        setReturnHomeConfig(get().returnHomeAfterLock, returnHomeTimeoutMinutes).catch(console.error);
      },
      setMindfulBreathingGate: (mindfulBreathingGate) => set({ mindfulBreathingGate }),
      setDeepHideDistractionsInDrawer: (deepHideDistractionsInDrawer) => set({ deepHideDistractionsInDrawer }),
    }),
    {
      name: "settings-store",
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          setReturnHomeConfig(state.returnHomeAfterLock ?? true, state.returnHomeTimeoutMinutes ?? 5).catch(console.error);
        }
      },
    }
  )
);
