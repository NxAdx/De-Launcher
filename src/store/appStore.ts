/**
 * App Store — Zustand + MMKV
 *
 * Manages installed apps, allowed/blocked lists, dock configuration,
 * folders, time-bound schedules, and whitelist synchronization.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "./storage";
import { AppInfo, FolderInfo, AppScheduleRule } from "@/src/types/app";
import { updateWhitelist } from "../../modules/de-launcher-native";

export type AppFocusState = "allowed" | "intent_pause" | "blocked";

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

interface AppState {
  // Data
  installedApps: AppInfo[];
  allowedPackages: string[];
  dockPackages: string[];
  intentPausePackages: string[];
  folders: FolderInfo[];
  scheduleRules: Record<string, AppScheduleRule>;
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

  // Folder Actions
  createFolder: (name: string, packageNames?: string[], color?: string) => string;
  updateFolder: (id: string, updates: Partial<FolderInfo>) => void;
  deleteFolder: (id: string) => void;
  addAppToFolder: (folderId: string, packageName: string) => void;
  removeAppFromFolder: (folderId: string, packageName: string) => void;

  // Schedule / Time-bound Actions
  setAppScheduleRule: (rule: AppScheduleRule) => void;
  removeAppScheduleRule: (packageName: string) => void;
  isAppWithinSchedule: (packageName: string) => { allowed: boolean; reason?: string };

  // Auto-arrange
  autoArrangeHome: (nonDistractionPackages: string[]) => void;

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
      folders: [],
      scheduleRules: {},
      exemptions: {},

      setInstalledApps: (apps) => {
        const installedPackageNames = new Set(apps.map((a) => a.packageName));
        const current = get();

        // Sanitize existing lists by removing apps that are no longer installed
        const sanitizedAllowed = current.allowedPackages.filter((pkg) =>
          installedPackageNames.has(pkg)
        );
        const sanitizedDock = current.dockPackages.filter((pkg) =>
          installedPackageNames.has(pkg)
        );
        const sanitizedIntentPause = current.intentPausePackages.filter((pkg) =>
          installedPackageNames.has(pkg)
        );

        // Sanitize folders
        const sanitizedFolders = (current.folders || []).map((f) => ({
          ...f,
          packageNames: f.packageNames.filter((pkg) =>
            installedPackageNames.has(pkg)
          ),
        }));

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
          folders: sanitizedFolders,
          ...(exemptionsChanged && { exemptions: sanitizedExemptions }),
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
        let newAllowed = allowedPackages.filter((p) => p !== packageName);
        let newIntentPause = intentPausePackages.filter((p) => p !== packageName);

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
        if (current.length >= 6) return; // Max 6 dock apps
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

      // ─── Folder Actions ─────────────────────────────────────
      createFolder: (name, packageNames = [], color) => {
        const id = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newFolder: FolderInfo = {
          id,
          name: name.trim() || "Folder",
          packageNames,
          color,
        };
        set((state) => ({ folders: [...(state.folders || []), newFolder] }));
        return id;
      },

      updateFolder: (id, updates) => {
        set((state) => ({
          folders: (state.folders || []).map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }));
      },

      deleteFolder: (id) => {
        set((state) => ({
          folders: (state.folders || []).filter((f) => f.id !== id),
        }));
      },

      addAppToFolder: (folderId, packageName) => {
        set((state) => ({
          folders: (state.folders || []).map((f) => {
            if (f.id === folderId && !f.packageNames.includes(packageName)) {
              return { ...f, packageNames: [...f.packageNames, packageName] };
            }
            return f;
          }),
        }));
      },

      removeAppFromFolder: (folderId, packageName) => {
        set((state) => ({
          folders: (state.folders || []).map((f) => {
            if (f.id === folderId) {
              return {
                ...f,
                packageNames: f.packageNames.filter((p) => p !== packageName),
              };
            }
            return f;
          }),
        }));
      },

      // ─── Schedule Actions ──────────────────────────────────
      setAppScheduleRule: (rule) => {
        set((state) => ({
          scheduleRules: {
            ...state.scheduleRules,
            [rule.packageName]: rule,
          },
        }));
        get().syncNativeWhitelist();
      },

      removeAppScheduleRule: (packageName) => {
        set((state) => {
          const next = { ...state.scheduleRules };
          delete next[packageName];
          return { scheduleRules: next };
        });
        get().syncNativeWhitelist();
      },

      isAppWithinSchedule: (packageName) => {
        const rule = get().scheduleRules[packageName];
        if (!rule || rule.scheduleType === "always_allowed") {
          return { allowed: true };
        }

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentDay = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
        const currentTimeVal = currentHour * 60 + currentMinute;

        if (rule.scheduleType === "work_hours") {
          // Monday - Friday, 09:00 to 17:00
          const isWeekday = currentDay >= 1 && currentDay <= 5;
          const isWorkTime = currentTimeVal >= 9 * 60 && currentTimeVal < 17 * 60;
          if (isWeekday && isWorkTime) {
            return { allowed: true };
          }
          return {
            allowed: false,
            reason: "Allowed only during work hours (9:00 AM – 5:00 PM Mon–Fri)",
          };
        }

        if (rule.scheduleType === "evening_only") {
          // 18:00 to 22:00
          const isEvening = currentTimeVal >= 18 * 60 && currentTimeVal < 22 * 60;
          if (isEvening) {
            return { allowed: true };
          }
          return {
            allowed: false,
            reason: "Allowed only in the evening (6:00 PM – 10:00 PM)",
          };
        }

        if (rule.scheduleType === "custom_window" && rule.customWindow) {
          const { startHour, startMinute, endHour, endMinute } = rule.customWindow;
          const startVal = startHour * 60 + startMinute;
          const endVal = endHour * 60 + endMinute;

          const inWindow =
            startVal <= endVal
              ? currentTimeVal >= startVal && currentTimeVal < endVal
              : currentTimeVal >= startVal || currentTimeVal < endVal; // overnight wrap

          if (inWindow) {
            return { allowed: true };
          }
          const formatTime = (h: number, m: number) => {
            const ampm = h >= 12 ? "PM" : "AM";
            const h12 = h % 12 || 12;
            return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
          };
          return {
            allowed: false,
            reason: `Allowed only between ${formatTime(startHour, startMinute)} and ${formatTime(endHour, endMinute)}`,
          };
        }

        if (rule.scheduleType === "blocked") {
          return { allowed: false, reason: "Blocked by focus rule" };
        }

        return { allowed: true };
      },

      autoArrangeHome: (nonDistractionPackages) => {
        set({ allowedPackages: nonDistractionPackages });
        get().syncNativeWhitelist();
      },

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

        // Allowed apps that are currently within schedule
        const whitelist = new Set<string>();

        for (const pkg of state.allowedPackages || []) {
          const scheduleCheck = state.isAppWithinSchedule(pkg);
          if (scheduleCheck.allowed) {
            whitelist.add(pkg);
          }
        }

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
      },
    }),
    {
      name: "app-store",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        allowedPackages: state.allowedPackages,
        dockPackages: state.dockPackages,
        intentPausePackages: state.intentPausePackages,
        folders: state.folders,
        scheduleRules: state.scheduleRules,
        exemptions: state.exemptions,
      }),
    }
  )
);
