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

export type AppFocusState = "allowed" | "intent_pause" | "blocked";

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

interface AppState {
  // Data
  installedApps: AppInfo[];
  allowedPackages: string[];
  dockPackages: string[];
  intentPausePackages: string[];
  exemptions: Record<string, number>; // packageName -> expiry timestamp (ms)

  // Actions
  setInstalledApps: (apps: AppInfo[]) => void;
  setAppFocusState: (packageName: string, state: AppFocusState) => void;
  setAllowedPackages: (packages: string[]) => void;
  addToDock: (packageName: string) => void;
  removeFromDock: (packageName: string) => void;
  reorderDock: (packages: string[]) => void;
  moveApp: (packageName: string, direction: "left" | "right") => void;
  moveDockApp: (packageName: string, direction: "left" | "right") => void;
  
  // Focus Rule Actions
  grantExemption: (packageName: string, durationMs: number) => void;
  pruneExemptions: () => void;
  
  // Computed helpers
  getAppFocusState: (packageName: string) => AppFocusState;
  hasActiveExemption: (packageName: string) => boolean;
  syncNativeWhitelist: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      installedApps: [],
      allowedPackages: [],
      dockPackages: [],
      intentPausePackages: [],
      exemptions: {},

      setInstalledApps: (apps) => {
        const installedPackageNames = new Set(apps.map((a) => a.packageName));
        const current = get();

        // Sanitize existing lists by removing apps that are no longer installed
        const sanitizedAllowed = current.allowedPackages.filter((pkg) => installedPackageNames.has(pkg));
        const sanitizedDock = current.dockPackages.filter((pkg) => installedPackageNames.has(pkg));
        const sanitizedIntentPause = current.intentPausePackages.filter((pkg) => installedPackageNames.has(pkg));
        
        const sanitizedExemptions = { ...current.exemptions };
        let exemptionsChanged = false;
        for (const pkg of Object.keys(sanitizedExemptions)) {
          if (!installedPackageNames.has(pkg)) {
            delete sanitizedExemptions[pkg];
            exemptionsChanged = true;
          }
        }

        set({ 
          installedApps: apps,
          allowedPackages: sanitizedAllowed,
          dockPackages: sanitizedDock,
          intentPausePackages: sanitizedIntentPause,
          ...(exemptionsChanged && { exemptions: sanitizedExemptions })
        });
      },

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
        get().syncNativeWhitelist();
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

      setAppFocusState: (packageName, state) => {
        const { allowedPackages = [], intentPausePackages = [] } = get();
        let newAllowed = allowedPackages.filter(p => p !== packageName);
        let newIntentPause = intentPausePackages.filter(p => p !== packageName);

        if (state === "allowed") {
          newAllowed.push(packageName);
        } else if (state === "intent_pause") {
          newIntentPause.push(packageName);
        }

        set({ allowedPackages: newAllowed, intentPausePackages: newIntentPause });
        get().syncNativeWhitelist();
      },

      setAllowedPackages: (packages) => {
        set({ allowedPackages: packages });
        get().syncNativeWhitelist();
      },

      addToDock: (packageName) => {
        const current = get().dockPackages;
        if (current.length >= 5) return; // Max 5 dock apps
        if (!current.includes(packageName)) {
          set({ dockPackages: [...current, packageName] });
          // Note: we don't automatically add it to whitelist. 
          // If a user puts an intent-pause app in the dock, it still pauses.
        }
      },

      removeFromDock: (packageName) => {
        set({
          dockPackages: get().dockPackages.filter((p) => p !== packageName),
        });
      },

      reorderDock: (packages) => set({ dockPackages: packages }),

      grantExemption: (packageName, durationMs) => {
        const currentExemptions = { ...get().exemptions };
        currentExemptions[packageName] = Date.now() + durationMs;
        set({ exemptions: currentExemptions });
        get().syncNativeWhitelist();
      },

      pruneExemptions: () => {
        const currentExemptions = get().exemptions || {};
        const now = Date.now();
        let changed = false;
        const nextExemptions: Record<string, number> = {};

        for (const [pkg, expiry] of Object.entries(currentExemptions)) {
          if (expiry > now) {
            nextExemptions[pkg] = expiry;
          } else {
            changed = true;
          }
        }

        if (changed) {
          set({ exemptions: nextExemptions });
          get().syncNativeWhitelist();
        }
      },

      getAppFocusState: (packageName) => {
        if ((get().allowedPackages || []).includes(packageName)) return "allowed";
        if ((get().intentPausePackages || []).includes(packageName)) return "intent_pause";
        return "blocked";
      },

      hasActiveExemption: (packageName) => {
        const exemptions = get().exemptions || {};
        const expiry = exemptions[packageName];
        return expiry !== undefined && expiry > Date.now();
      },

      syncNativeWhitelist: () => {
        const state = get();
        const now = Date.now();
        
        // Allowed apps
        const whitelist = new Set(state.allowedPackages || []);
        
        // Active exemptions
        for (const [pkg, expiry] of Object.entries(state.exemptions || {})) {
          if (expiry > now) {
            whitelist.add(pkg);
          }
        }

        if (syncTimeout) {
          clearTimeout(syncTimeout);
        }
        
        syncTimeout = setTimeout(() => {
          updateWhitelist(Array.from(whitelist)).catch(console.error);
        }, 500);
      }
    }),
    {
      name: "app-store",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        allowedPackages: state.allowedPackages,
        dockPackages: state.dockPackages,
        intentPausePackages: state.intentPausePackages,
        exemptions: state.exemptions,
      }),
    }
  )
);
