import { NativeModule, requireOptionalNativeModule } from 'expo';

import { DeLauncherNativeModuleEvents } from './DeLauncherNative.types';

export interface AppInfo {
  packageName: string;
  label: string;
  icon: string | null;
  isSystem: boolean;
}

export interface IconPackInfo {
  packageName: string;
  label: string;
  mappingCount: number;
}

declare class DeLauncherNativeModule extends NativeModule<DeLauncherNativeModuleEvents> {
  // App Management
  getInstalledApps(): Promise<AppInfo[]>;
  launchApp(packageName: string): Promise<void>;
  updateWhitelist(whitelist: string[]): Promise<void>;
  
  // Icon Packs
  getAvailableIconPacks(): Promise<IconPackInfo[]>;
  getIconFromPack(iconPackPackage: string, drawableName: string): Promise<string | null>;
  
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
  getAvailableIconPacks: async () => [],
  getIconFromPack: async () => null,
  allocateAppWidgetId: async () => -1,
  startWidgetBindFlow: async () => -1,
} as unknown as DeLauncherNativeModule;

// Expo Go does not include this local native module. Use a safe JS fallback so
// the interface can still be previewed while native launcher features stay inert.
export default NativeDeLauncherModule ?? expoGoFallback;
