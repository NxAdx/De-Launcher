import type { StyleProp, ViewStyle } from 'react-native';

export type OnLoadEventPayload = {
  url: string;
};

export type DeLauncherNativeModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
  onHomePressed: (params: any) => void;
  onPackageRemoved: (params: { packageName: string }) => void;
  onPackageAdded: (params: { packageName: string }) => void;
  onPackageChanged: (params: { packageName: string }) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type DeLauncherNativeViewProps = {
  appWidgetId: number;
  style?: StyleProp<ViewStyle>;
};
