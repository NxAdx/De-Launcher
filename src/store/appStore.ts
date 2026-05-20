/**
 * App Store — Zustand + MMKV
 *
 * Manages installed apps, allowed/blocked lists, and dock configuration.
 * App data comes from a native module (mocked for now).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "./storage";
import { AppInfo } from "@/src/types/app";
import { updateWhitelist } from "../../modules/de-launcher-native";

interface AppState {
  // Data
  installedApps: AppInfo[];
  allowedPackages: string[];
  dockPackages: string[];

  // Actions
  setInstalledApps: (apps: AppInfo[]) => void;
  toggleAppAllowed: (packageName: string) => void;
  setAllowedPackages: (packages: string[]) => void;
  addToDock: (packageName: string) => void;
  removeFromDock: (packageName: string) => void;
  reorderDock: (packages: string[]) => void;

  // Computed helpers
  isAllowed: (packageName: string) => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      installedApps: [],
      allowedPackages: [],
      dockPackages: [],

      setInstalledApps: (apps) => set({ installedApps: apps }),

      toggleAppAllowed: (packageName) => {
        const current = get().allowedPackages;
        let newPackages;
        if (current.includes(packageName)) {
          newPackages = current.filter((p) => p !== packageName);
        } else {
          newPackages = [...current, packageName];
        }
        set({ allowedPackages: newPackages });
        updateWhitelist(newPackages).catch(console.error);
      },

      setAllowedPackages: (packages) => {
        set({ allowedPackages: packages });
        updateWhitelist(packages).catch(console.error);
      },

      addToDock: (packageName) => {
        const current = get().dockPackages;
        if (current.length >= 5) return; // Max 5 dock apps
        if (!current.includes(packageName)) {
          set({ dockPackages: [...current, packageName] });
        }
      },

      removeFromDock: (packageName) => {
        set({
          dockPackages: get().dockPackages.filter((p) => p !== packageName),
        });
      },

      reorderDock: (packages) => set({ dockPackages: packages }),

      isAllowed: (packageName) => get().allowedPackages.includes(packageName),
    }),
    {
      name: "app-store",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        allowedPackages: state.allowedPackages,
        dockPackages: state.dockPackages,
      }),
    }
  )
);
