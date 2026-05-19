/**
 * Dock Component
 *
 * Fixed bottom bar with essential apps.
 * Subtle frosted glass effect. Max 5 apps.
 */
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/src/theme/ThemeContext";
import { spacing, layout } from "@/src/theme/tokens";
import { AppIcon } from "./AppIcon";
import { useAppStore } from "@/src/store/appStore";
import { AppInfo } from "@/src/types/app";
import { launchApp } from "@/src/services/appManager";

export function Dock() {
  const { colors, isDark } = useTheme();
  const dockApps = useAppStore((s) => s.getDockApps());

  const handlePress = useCallback((app: AppInfo) => {
    launchApp(app.packageName);
  }, []);

  if (dockApps.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(200)}
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.04)"
            : "rgba(0, 0, 0, 0.04)",
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={styles.icons}>
        {dockApps.map((app) => (
          <AppIcon
            key={app.packageName}
            app={app}
            onPress={handlePress}
            size={layout.appIconSize}
            showLabel={false}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: layout.dockHeight,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xl,
  },
  icons: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
});
