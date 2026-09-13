import { NativeModule, requireOptionalNativeModule } from 'expo';

import { DeLauncherNativeModuleEvents } from './DeLauncherNative.types';

export interface AppInfo {
  packageName: string;
  label: string;
  icon: string | null;
  monoIcon?: string | null;
  isSystem: boolean;
}

export interface IconPackInfo {
  packageName: string;
  label: string;
  mappingCount: number | null;
}

export interface ScreenTimeInfo {
  screenTimeMs: number;
  unlockCount: number;
}

export interface AppUsageItem {
  packageName: string;
  label: string;
  timeMs: number;
}

declare class DeLauncherNativeModule extends NativeModule<DeLauncherNativeModuleEvents> {
  // App Management
  getInstalledApps(): Promise<AppInfo[]>;
  launchApp(packageName: string): Promise<void>;
  updateWhitelist(whitelist: string[]): Promise<void>;
  updateFocusLists(blockedPackages: string[], intentPausePackages: string[]): Promise<void>;
  setReturnHomeConfig(enabled: boolean, timeoutMinutes: number): Promise<void>;
  promptSetDefaultLauncher(): Promise<void>;
  changeWallpaper(): Promise<void>;
  
  // Icon Packs
  getAvailableIconPacks(): Promise<IconPackInfo[]>;
  getIconFromPack(iconPackPackage: string, drawableName: string): Promise<string | null>;
  getSystemAppIcon(packageName: string): Promise<string | null>;
  getMonochromeAppIcon(packageName: string): Promise<string | null>;
  getSystemAppIcons(packageNames: string[]): Promise<Record<string, string | null>>;
  getMonochromeAppIcons(packageNames: string[]): Promise<Record<string, string | null>>;
  
  // Digital Wellbeing & Usage Stats (from Olauncher)
  hasUsageStatsPermission(): Promise<boolean>;
  openUsageStatsSettings(): Promise<void>;
  openDigitalWellbeing(): Promise<boolean>;
  getScreenTimeToday(): Promise<ScreenTimeInfo>;
  getTopAppUsage(limit: number): Promise<AppUsageItem[]>;

  // System & Gestures
  openClockApp(): Promise<boolean>;
  openCalendarApp(): Promise<boolean>;
  lockScreen(): Promise<boolean>;
  openNotificationShade(): Promise<boolean>;
  isAccessibilityActive(): Promise<boolean>;

  // Widget Support
  allocateAppWidgetId(): Promise<number>;
  startWidgetBindFlow(allocatedId: number): Promise<number>;
}

const NativeDeLauncherModule =
  requireOptionalNativeModule<DeLauncherNativeModule>('DeLauncherNative');

const expoGoFallback = {
  getInstalledApps: async () => [],
  launchApp: async (packageName: string) => {
    console.warn(
      `[DeLauncherNative] launchApp(${packageName}) requires an Android development build.`
    );
  },
  updateWhitelist: async () => {},
  updateFocusLists: async () => {},
  setReturnHomeConfig: async () => {},
  promptSetDefaultLauncher: async () => {
    console.warn(
      `[DeLauncherNative] promptSetDefaultLauncher() requires an Android development build.`
    );
  },
  changeWallpaper: async () => {
    console.warn(
      `[DeLauncherNative] changeWallpaper() requires an Android development build.`
    );
  },
  getAvailableIconPacks: async () => [],
  getIconFromPack: async () => null,
  getSystemAppIcon: async () => null,
  getMonochromeAppIcon: async () => null,
  getSystemAppIcons: async () => ({}),
  getMonochromeAppIcons: async () => ({}),
  hasUsageStatsPermission: async () => false,
  openUsageStatsSettings: async () => {},
  openDigitalWellbeing: async () => false,
  getScreenTimeToday: async () => ({ screenTimeMs: 0, unlockCount: 0 }),
  getTopAppUsage: async () => [],
  openClockApp: async () => false,
  openCalendarApp: async () => false,
  lockScreen: async () => false,
  openNotificationShade: async () => false,
  isAccessibilityActive: async () => false,
  allocateAppWidgetId: async () => -1,
  startWidgetBindFlow: async () => -1,
} as unknown as DeLauncherNativeModule;

// Expo Go does not include this local native module. Use a safe JS fallback so
// the interface can still be previewed while native launcher features stay inert.
export default NativeDeLauncherModule ?? expoGoFallback;

