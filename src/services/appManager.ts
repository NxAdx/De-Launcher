/**
 * App Manager Service
 *
 * Abstraction over the native module for app-related operations.
 * Uses the Android native module when available and a small preview dataset in
 * Expo Go, where local native modules cannot be loaded.
 */
import { AppInfo } from "@/src/types/app";
import {
  getInstalledApps as nativeGetInstalledApps,
  launchApp as nativeLaunchApp,
  getAvailableIconPacks as nativeGetAvailableIconPacks,
  getIconFromPack as nativeGetIconFromPack,
  promptSetDefaultLauncher as nativePromptSetDefaultLauncher,
  changeWallpaper as nativeChangeWallpaper,
  type IconPackInfo,
} from "../../modules/de-launcher-native";

const PREVIEW_APPS: AppInfo[] = [
  {
    packageName: "com.google.android.dialer",
    label: "Phone",
    icon: null,
    isSystem: true,
  },
  {
    packageName: "com.google.android.apps.messaging",
    label: "Messages",
    icon: null,
    isSystem: true,
  },
  {
    packageName: "com.google.android.gm",
    label: "Gmail",
    icon: null,
    isSystem: false,
  },
  {
    packageName: "com.google.android.calendar",
    label: "Calendar",
    icon: null,
    isSystem: false,
  },
  {
    packageName: "com.android.chrome",
    label: "Chrome",
    icon: null,
    isSystem: false,
  },
  {
    packageName: "com.google.android.keep",
    label: "Keep Notes",
    icon: null,
    isSystem: false,
  },
  {
    packageName: "com.notion.id",
    label: "Notion",
    icon: null,
    isSystem: false,
  },
  {
    packageName: "com.slack",
    label: "Slack",
    icon: null,
    isSystem: false,
  },
  {
    packageName: "com.instagram.android",
    label: "Instagram",
    icon: null,
    isSystem: false,
  },
  {
    packageName: "com.google.android.youtube",
    label: "YouTube",
    icon: null,
    isSystem: false,
  },
];

/**
 * Get all installed apps from the device.
 */
export async function getInstalledApps(): Promise<AppInfo[]> {
  try {
    const apps = await nativeGetInstalledApps();
    if (apps.length === 0) {
      return PREVIEW_APPS;
    }
    // Sort alphabetically by label
    return apps.sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error("[AppManager] Error fetching apps:", error);
    return PREVIEW_APPS;
  }
}

/**
 * Launch an app by package name.
 */
export async function launchApp(packageName: string): Promise<void> {
  console.log(`[AppManager] Launching: ${packageName}`);
  try {
    await nativeLaunchApp(packageName);
  } catch (error) {
    console.error(`[AppManager] Error launching ${packageName}:`, error);
  }
}

/**
 * Get all available icon packs installed on the device.
 */
export async function getAvailableIconPacks(): Promise<IconPackInfo[]> {
  try {
    return await nativeGetAvailableIconPacks();
  } catch (error) {
    console.error("[AppManager] Error fetching icon packs:", error);
    return [];
  }
}

const iconPackCache = new Map<string, string | null>();

/**
 * Get an icon from a specific icon pack (uses memory cache first).
 */
export async function getIconFromPack(
  iconPackPackage: string,
  drawableName: string
): Promise<string | null> {
  const cacheKey = `${iconPackPackage}:${drawableName}`;
  if (iconPackCache.has(cacheKey)) {
    return iconPackCache.get(cacheKey) ?? null;
  }
  try {
    const iconUri = await nativeGetIconFromPack(iconPackPackage, drawableName);
    iconPackCache.set(cacheKey, iconUri);
    return iconUri;
  } catch (error) {
    console.error(
      `[AppManager] Error getting icon from pack ${iconPackPackage}:`,
      error
    );
    iconPackCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Synchronously check if a custom icon pack URI is cached.
 */
export function getCachedIcon(iconPackPackage: string, drawableName: string): string | null | undefined {
  const cacheKey = `${iconPackPackage}:${drawableName}`;
  return iconPackCache.get(cacheKey);
}

/**
 * Prefetch a custom icon into cache.
 */
export async function prefetchIcon(iconPackPackage: string, drawableName: string): Promise<void> {
  const cacheKey = `${iconPackPackage}:${drawableName}`;
  if (iconPackCache.has(cacheKey)) return;
  try {
    const iconUri = await nativeGetIconFromPack(iconPackPackage, drawableName);
    iconPackCache.set(cacheKey, iconUri);
  } catch (e) {
    iconPackCache.set(cacheKey, null);
  }
}

/**
 * Clear the icon pack memory cache.
 */
export function clearIconPackCache(): void {
  iconPackCache.clear();
}

/**
 * Prompt the user to set De-Launcher as their default home screen.
 */
export async function promptSetDefaultLauncher(): Promise<void> {
  try {
    await nativePromptSetDefaultLauncher();
  } catch (error) {
    console.error("[AppManager] Error promoting default launcher:", error);
  }
}

/**
 * Open the system wallpaper picker chooser.
 */
export async function changeWallpaper(): Promise<void> {
  try {
    await nativeChangeWallpaper();
  } catch (error) {
    console.error("[AppManager] Error opening wallpaper picker:", error);
  }
}

/**
 * Default apps that should be in the dock on first install.
 */
export const DEFAULT_DOCK_PACKAGES = [
  "com.google.android.dialer",
  "com.google.android.apps.messaging",
  "com.android.chrome",
  "com.google.android.gm",
];

/**
 * Default allowed apps — productivity-friendly apps that won't be blocked.
 */
export const DEFAULT_ALLOWED_PACKAGES = [
  "com.google.android.dialer",
  "com.google.android.apps.messaging",
  "com.google.android.gm",
  "com.google.android.apps.maps",
  "com.google.android.calendar",
  "com.android.settings",
  "com.android.chrome",
  "com.google.android.keep",
  "com.google.android.apps.docs",
  "com.todoist",
  "com.notion.id",
  "com.slack",
  "com.google.android.apps.photos",
];

/**
 * Apps commonly considered "distracting" — used for auto-detection.
 */
export const KNOWN_DISTRACTION_PACKAGES = [
  "com.instagram.android",
  "com.twitter.android",
  "com.snapchat.android",
  "com.reddit.frontpage",
  "com.facebook.katana",
  "com.tiktok.android",
  "com.google.android.youtube",
];
