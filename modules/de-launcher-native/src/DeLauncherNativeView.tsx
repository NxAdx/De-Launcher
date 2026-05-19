import { requireOptionalNativeModule, requireNativeView } from 'expo';
import * as React from 'react';
import { View } from 'react-native';

import { DeLauncherNativeViewProps } from './DeLauncherNative.types';

const NativeView: React.ComponentType<DeLauncherNativeViewProps> | null =
  requireOptionalNativeModule('DeLauncherNative')
    ? requireNativeView('DeLauncherNative')
    : null;

export default function DeLauncherNativeView(props: DeLauncherNativeViewProps) {
  if (!NativeView) {
    return <View style={props.style} />;
  }

  return <NativeView {...props} />;
}
