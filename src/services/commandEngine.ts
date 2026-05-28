import { AppInfo } from "@/src/types/app";
import { launchApp } from "./appManager";
import { router } from "expo-router";
import * as IntentLauncher from "expo-intent-launcher";

export type CommandType = "app" | "action";

export interface CommandItem {
  id: string;
  type: CommandType;
  title: string;
  subtitle?: string;
  iconName?: "Settings" | "Layout" | "Shield" | "Home" | "Smartphone";
  appInfo?: AppInfo;
  action: () => void;
}

export const STATIC_COMMANDS: CommandItem[] = [
  {
    id: "cmd_launcher_settings",
    type: "action",
    title: "Launcher Settings",
    subtitle: "Customize De-Launcher appearance and layout",
    iconName: "Settings",
    action: () => router.push("/settings"),
  },
  {
    id: "cmd_android_settings",
    type: "action",
    title: "Android Settings",
    subtitle: "Open device settings",
    iconName: "Smartphone",
    action: () => {
      try {
        IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.SETTINGS);
      } catch (e) {
        console.warn("Failed to open Android Settings", e);
      }
    },
  },
  {
    id: "cmd_android_home",
    type: "action",
    title: "Default Apps",
    subtitle: "Manage default launcher and apps",
    iconName: "Home",
    action: () => {
      try {
        IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.HOME_SETTINGS);
      } catch (e) {
        console.warn("Failed to open Home Settings", e);
      }
    },
  },
  {
    id: "cmd_android_accessibility",
    type: "action",
    title: "Accessibility Settings",
    subtitle: "Manage Focus Mode permissions",
    iconName: "Shield",
    action: () => {
      try {
        IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.ACCESSIBILITY_SETTINGS);
      } catch (e) {
        console.warn("Failed to open Accessibility Settings", e);
      }
    },
  },
];

export function performSearch(query: string, installedApps: AppInfo[]): CommandItem[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  // 1. Convert installed apps to CommandItem
  const appCommands: CommandItem[] = installedApps.map((app) => ({
    id: `app_${app.packageName}`,
    type: "app",
    title: app.label,
    subtitle: app.packageName,
    appInfo: app,
    action: () => launchApp(app.packageName),
  }));

  const allItems = [...appCommands, ...STATIC_COMMANDS];

  if (!normalizedQuery) {
    // If no query, maybe return a few suggestions or nothing. 
    // For now, let's return static commands + some apps or just empty.
    // Let's return only static commands for empty state to keep it clean.
    return STATIC_COMMANDS;
  }

  // 2. Filter and score
  const results = allItems
    .map((item) => {
      const titleLower = item.title.toLowerCase();
      const subLower = item.subtitle?.toLowerCase() || "";
      
      let score = 0;
      if (titleLower === normalizedQuery) score = 100;
      else if (titleLower.startsWith(normalizedQuery)) score = 50;
      else if (titleLower.includes(normalizedQuery)) score = 25;
      else if (subLower.includes(normalizedQuery)) score = 10;

      return { item, score };
    })
    .filter((res) => res.score > 0)
    .sort((a, b) => {
      // Higher score first
      if (a.score !== b.score) return b.score - a.score;
      // Alphabetical fallback
      return a.item.title.localeCompare(b.item.title);
    });

  return results.map((res) => res.item);
}
