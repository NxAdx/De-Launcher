import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { DeLauncherNativeView } from '../../modules/de-launcher-native';

interface WidgetHostProps {
  appWidgetId: number;
  style?: ViewStyle;
}

export function WidgetHost({ appWidgetId, style }: WidgetHostProps) {
  if (appWidgetId === -1) {
    return null;
  }

  return (
    <DeLauncherNativeView
      appWidgetId={appWidgetId}
      style={[styles.container, style]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
});
