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
  getSystemAppIcon as nativeGetSystemAppIcon,
  getSystemAppIcons as nativeGetSystemAppIcons,
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
let cachedIconPacks: IconPackInfo[] | null = null;
let iconPackListRequest: Promise<IconPackInfo[]> | null = null;

export async function getAvailableIconPacks(): Promise<IconPackInfo[]> {
  if (cachedIconPacks !== null) return cachedIconPacks;
  if (iconPackListRequest !== null) return iconPackListRequest;

  iconPackListRequest = nativeGetAvailableIconPacks()
    .then((packs) => {
      cachedIconPacks = packs;
      return packs;
    })
    .catch((error) => {
      console.error("[AppManager] Error fetching icon packs:", error);
      cachedIconPacks = [];
      return [];
    })
    .finally(() => {
      iconPackListRequest = null;
    });
  return iconPackListRequest;
}

const iconPackCache = new Map<string, string | null>();
const iconPackRequests = new Map<string, Promise<string | null>>();

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
  const pendingRequest = iconPackRequests.get(cacheKey);
  if (pendingRequest) return pendingRequest;

  const request = nativeGetIconFromPack(iconPackPackage, drawableName)
    .then((iconUri) => {
      iconPackCache.set(cacheKey, iconUri);
      return iconUri;
    })
    .catch((error) => {
      console.error(
        `[AppManager] Error getting icon from pack ${iconPackPackage}:`,
        error
      );
      iconPackCache.set(cacheKey, null);
      return null;
    })
    .finally(() => {
      iconPackRequests.delete(cacheKey);
    });
  iconPackRequests.set(cacheKey, request);
  return request;
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
  await getIconFromPack(iconPackPackage, drawableName);
}

/**
 * Clear the icon pack memory cache.
 */
export function clearIconPackCache(): void {
  iconPackCache.clear();
}

const systemIconCache = new Map<string, string | null>();
const systemIconRequests = new Map<string, Promise<string | null>>();

/**
 * Get system app icon (uses memory cache first, falls back to native getSystemAppIcon on-demand).
 */
export async function getSystemAppIcon(packageName: string): Promise<string | null> {
  if (systemIconCache.has(packageName)) {
    return systemIconCache.get(packageName) ?? null;
  }
  const pendingRequest = systemIconRequests.get(packageName);
  if (pendingRequest) return pendingRequest;

  const request = nativeGetSystemAppIcon(packageName)
    .then((iconUri) => {
      systemIconCache.set(packageName, iconUri);
      return iconUri;
    })
    .catch((error) => {
      console.error(`[AppManager] Error getting system icon for ${packageName}:`, error);
      return null;
    })
    .finally(() => {
      systemIconRequests.delete(packageName);
    });
  systemIconRequests.set(packageName, request);
  return request;
}

/**
 * Synchronously check if a system icon is cached.
 */
export function getCachedSystemIcon(packageName: string): string | null | undefined {
  return systemIconCache.get(packageName);
}

/**
 * Prefetch a system app icon in the background and cache it.
 */
export async function prefetchSystemIcon(packageName: string): Promise<void> {
  await getSystemAppIcon(packageName);
}

/**
 * Batch-load all system app icons in a single native bridge call.
 * Populates the systemIconCache so AppIcon components mount with icons synchronously.
 */
export async function batchLoadSystemIcons(packageNames: string[]): Promise<void> {
  const uniquePackages = [...new Set(packageNames)];
  const pending = uniquePackages
    .map((pkg) => systemIconRequests.get(pkg))
    .filter((request): request is Promise<string | null> => request !== undefined);
  const uncached = uniquePackages.filter(
    (pkg) => !systemIconCache.has(pkg) && !systemIconRequests.has(pkg)
  );

  if (uncached.length > 0) {
    const batchRequest = nativeGetSystemAppIcons(uncached);
    for (const pkg of uncached) {
      const request = batchRequest
        .then((icons) => {
          const iconUri = icons[pkg] ?? null;
          systemIconCache.set(pkg, iconUri);
          return iconUri;
        })
        .catch((error) => {
          console.error("[AppManager] Batch icon loading failed:", error);
          return null;
        })
        .finally(() => {
          systemIconRequests.delete(pkg);
        });
      systemIconRequests.set(pkg, request);
      pending.push(request);
    }
  }

  await Promise.all(pending);
}

/**
 * Pre-scan icon packs during boot so settings screen loads instantly.
 */
export async function preloadIconPacks(): Promise<IconPackInfo[]> {
  return getAvailableIconPacks();
}

/**
 * Get cached icon packs synchronously (returns null if not yet preloaded).
 */
export function getCachedIconPacks(): IconPackInfo[] | null {
  return cachedIconPacks;
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
