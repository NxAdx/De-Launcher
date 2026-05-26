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
  moveApp: (packageName: string, direction: "left" | "right") => void;
  moveDockApp: (packageName: string, direction: "left" | "right") => void;

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

      moveApp: (packageName, direction) => {
        const current = [...get().allowedPackages];
        const index = current.indexOf(packageName);
        if (index === -1) return;

        const newIndex = direction === "left" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= current.length) return;

        const temp = current[index];
        current[index] = current[newIndex];
        current[newIndex] = temp;

        set({ allowedPackages: current });
        updateWhitelist(current).catch(console.error);
      },

      moveDockApp: (packageName, direction) => {
        const current = [...get().dockPackages];
        const index = current.indexOf(packageName);
        if (index === -1) return;

        const newIndex = direction === "left" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= current.length) return;

        const temp = current[index];
        current[index] = current[newIndex];
        current[newIndex] = temp;

        set({ dockPackages: current });
      },

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
