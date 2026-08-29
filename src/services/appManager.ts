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

export const DEFAULT_DOCK_PACKAGES = [
  "com.google.android.dialer",
  "com.google.android.apps.messaging",
  "com.android.chrome",
  "com.google.android.gm",
  "com.google.android.apps.photos",
];

export const DEFAULT_ALLOWED_PACKAGES: string[] = [];

/**
 * Automatically resolve default dock packages based on actual installed apps across all Android OEMs.
 */
export function resolveDefaultDockPackages(installedApps: AppInfo[]): string[] {
  if (!installedApps || installedApps.length === 0) return DEFAULT_DOCK_PACKAGES;
  const packages = new Set(installedApps.map((a) => a.packageName));

  const dialer = installedApps.find((a) =>
    (/dialer|phone/i.test(a.packageName) || /phone/i.test(a.label)) && !/voice|recording/i.test(a.label)
  )?.packageName;

  const messages = installedApps.find((a) =>
    /messaging|messages|mms|sms/i.test(a.packageName) || /messages/i.test(a.label)
  )?.packageName;

  const browser = installedApps.find((a) =>
    /chrome|browser|firefox|opera/i.test(a.packageName) || /chrome|browser/i.test(a.label)
  )?.packageName;

  const camera = installedApps.find((a) =>
    /camera/i.test(a.packageName) || /camera/i.test(a.label)
  )?.packageName;

  const photos = installedApps.find((a) =>
    /photos|gallery|albums/i.test(a.packageName) || /photos|gallery|albums/i.test(a.label)
  )?.packageName;

  const resolved = [dialer, messages, browser, camera, photos].filter(
    (pkg): pkg is string => !!pkg && packages.has(pkg)
  );

  // Fill up to 5 with other non-system apps if needed
  if (resolved.length < 5) {
    for (const app of installedApps) {
      if (resolved.length >= 5) break;
      if (!resolved.includes(app.packageName)) {
        resolved.push(app.packageName);
      }
    }
  }

  return [...new Set(resolved)];
}

/**
 * Automatically resolve default home screen apps from installed apps excluding dock items.
 */
export function resolveDefaultAllowedPackages(installedApps: AppInfo[], dockPackages: string[]): string[] {
  const dockSet = new Set(dockPackages);
  return installedApps
    .map((a) => a.packageName)
    .filter((pkg) => !dockSet.has(pkg));
}

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

    // Pre-populate systemIconCache with real icon URIs
    for (const app of apps) {
      if (app.icon) {
        systemIconCache.set(app.packageName, app.icon);
      }
    }

    // Deduplicate in JS as an additional safety guard
    const seen = new Set<string>();
    const uniqueApps: AppInfo[] = [];
    for (const app of apps) {
      if (!seen.has(app.packageName)) {
        seen.add(app.packageName);
        uniqueApps.push(app);
      }
    }

    // Sort alphabetically by label
    return uniqueApps.sort((a, b) => a.label.localeCompare(b.label));
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
      systemIconCache.set(packageName, null);
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
          systemIconCache.set(pkg, null);
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
 * Apps commonly considered "distracting" — social media, short-form video, infinite feeds, games.
 */
export const KNOWN_DISTRACTION_PACKAGES = [
  "com.instagram.android",
  "com.twitter.android",
  "com.zhiliaoapp.musically",
  "com.ss.android.ugc.trill",
  "com.tiktok.android",
  "com.snapchat.android",
  "com.reddit.frontpage",
  "com.facebook.katana",
  "com.facebook.orca",
  "com.google.android.youtube",
  "com.netflix.mediaclient",
  "com.disney.disneyplus",
  "com.amazon.avod.thirdpartyclient",
  "tv.twitch.android.app",
  "com.pinterest",
  "com.bytedance.tiktok",
  "com.supercell.clashofclans",
  "com.supercell.clashroyale",
  "com.supercell.brawlstars",
  "com.king.candycrushsaga",
  "com.dts.freefireth",
  "com.tencent.ig",
  "com.activision.callofduty.shooter",
  "com.roblox.client",
];

/**
 * Check if a package is a known distraction.
 */
export function isKnownDistraction(packageName: string): boolean {
  const lower = packageName.toLowerCase();
  return (
    KNOWN_DISTRACTION_PACKAGES.includes(packageName) ||
    lower.includes("tiktok") ||
    lower.includes("instagram") ||
    lower.includes("snapchat") ||
    lower.includes("game")
  );
}

/**
 * Filter installed apps to obtain all non-distracting productivity/utility apps.
 */
export function getNonDistractionApps(installedApps: AppInfo[]): AppInfo[] {
  return installedApps.filter((app) => !isKnownDistraction(app.packageName));
}
