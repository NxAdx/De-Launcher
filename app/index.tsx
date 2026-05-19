/**
 * Homescreen — De-Launcher
 *
 * The main launcher screen. Features:
 * - Large minimal clock
 * - Grid of allowed (whitelisted) apps only
 * - Dock at the bottom
 * - Swipe up to open app drawer
 */
import React, { useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { router } from "expo-router";
import { Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { spacing } from "@/src/theme/tokens";
import { Clock } from "@/src/components/Clock";
import { AppGrid } from "@/src/components/AppGrid";
import { Dock } from "@/src/components/Dock";
import { useAppStore } from "@/src/store/appStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { launchApp } from "@/src/services/appManager";
import { AppInfo } from "@/src/types/app";

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const showClock = useSettingsStore((s) => s.showClock);
  const getAllowedApps = useAppStore((s) => s.getAllowedApps);
  const allowedApps = getAllowedApps();

  const handleAppPress = useCallback((app: AppInfo) => {
    launchApp(app.packageName);
  }, []);

  const handleAppLongPress = useCallback((_app: AppInfo) => {
    // TODO: Open context menu (remove from home, add to dock, block)
  }, []);

  // Swipe up gesture to open app drawer
  const swipeUp = Gesture.Pan()
    .activeOffsetY(-50)
    .onEnd((event) => {
      if (event.translationY < -80) {
        router.push("/drawer");
      }
    })
    .runOnJS(true);

  return (
    <GestureDetector gesture={swipeUp}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Settings gear */}
        <Animated.View
          entering={FadeIn.delay(400)}
          style={[styles.settingsButton, { top: insets.top + spacing.sm }]}
        >
          <Pressable
            onPress={() => router.push("/settings")}
            hitSlop={16}
            style={styles.settingsPressable}
          >
            <Settings size={20} color={colors.textTertiary} />
          </Pressable>
        </Animated.View>

        {/* Clock */}
        {showClock && (
          <View style={{ paddingTop: insets.top }}>
            <Clock />
          </View>
        )}

        {/* App Grid — only allowed apps */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(300)}
          style={styles.gridContainer}
        >
          <AppGrid
            apps={allowedApps}
            onPress={handleAppPress}
            onLongPress={handleAppLongPress}
          />
        </Animated.View>

        {/* Dock */}
        <Dock />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsButton: {
    position: "absolute",
    right: spacing.xl,
    zIndex: 10,
  },
  settingsPressable: {
    padding: spacing.sm,
    borderRadius: 999,
  },
  gridContainer: {
    flex: 1,
  },
});
