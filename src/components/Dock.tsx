/**
 * Dock Component
 *
 * Fixed bottom bar with essential apps.
 * Subtle frosted glass effect. Max 5 apps.
 * Features a dedicated App Drawer button at the end.
 */
import React, { useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LayoutGrid } from "lucide-react-native";
import { router } from "expo-router";
import { useTheme } from "@/src/theme/ThemeContext";
import { spacing, layout, radii } from "@/src/theme/tokens";
import { AppIcon } from "./AppIcon";
import { useAppStore } from "@/src/store/appStore";
import { AppInfo } from "@/src/types/app";
import { launchApp } from "@/src/services/appManager";

interface DockProps {
  onLongPress: (app: AppInfo) => void;
}

export function Dock({ onLongPress }: DockProps) {
  const { colors, isDark } = useTheme();
  const installedApps = useAppStore((s) => s.installedApps);
  const dockPackages = useAppStore((s) => s.dockPackages);

  const dockApps = React.useMemo(() => {
    return dockPackages
      .map((pkg) => installedApps.find((app) => app.packageName === pkg))
      .filter((app): app is AppInfo => !!app);
  }, [installedApps, dockPackages]);

  const handlePress = useCallback((app: AppInfo) => {
    launchApp(app.packageName);
  }, []);

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
            onLongPress={onLongPress}
            size={layout.appIconSize}
            showLabel={false}
          />
        ))}

        {/* Permanent Premium App Drawer trigger button */}
        <Pressable
          onPress={() => router.push("/drawer")}
          style={({ pressed }) => [
            styles.drawerButton,
            {
              width: layout.appIconSize,
              height: layout.appIconSize,
              borderRadius: layout.appIconSize * 0.22,
              backgroundColor: pressed
                ? "rgba(167, 139, 250, 0.2)"
                : isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.05)",
            },
          ]}
        >
          <LayoutGrid size={24} color={colors.accent} />
        </Pressable>
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
  drawerButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
