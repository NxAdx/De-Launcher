import type { StyleProp, ViewStyle } from 'react-native';

export type OnLoadEventPayload = {
  url: string;
};

export type DeLauncherNativeModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type DeLauncherNativeViewProps = {
  appWidgetId: number;
  style?: StyleProp<ViewStyle>;
};
