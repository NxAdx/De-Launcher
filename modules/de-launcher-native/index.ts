import DeLauncherNativeModule from './src/DeLauncherNativeModule';

export type AppInfo = {
  packageName: string;
  label: string;
  icon: string | null;
  isSystem: boolean;
};

export type IconPackInfo = {
  packageName: string;
  label: string;
  mappingCount: number;
};

export async function getInstalledApps(): Promise<AppInfo[]> {
  return await DeLauncherNativeModule.getInstalledApps();
}

export async function launchApp(packageName: string): Promise<void> {
  return await DeLauncherNativeModule.launchApp(packageName);
}

export async function updateWhitelist(whitelist: string[]): Promise<void> {
  return await DeLauncherNativeModule.updateWhitelist(whitelist);
}

export async function getAvailableIconPacks(): Promise<IconPackInfo[]> {
  return await DeLauncherNativeModule.getAvailableIconPacks();
}

export async function getIconFromPack(
  iconPackPackage: string,
  drawableName: string
): Promise<string | null> {
  return await DeLauncherNativeModule.getIconFromPack(iconPackPackage, drawableName);
}

export async function allocateAppWidgetId(): Promise<number> {
  return await DeLauncherNativeModule.allocateAppWidgetId();
}

export async function startWidgetBindFlow(allocatedId: number): Promise<number> {
  return await DeLauncherNativeModule.startWidgetBindFlow(allocatedId);
}

export { default as DeLauncherNativeView } from './src/DeLauncherNativeView';
export * from './src/DeLauncherNative.types';
