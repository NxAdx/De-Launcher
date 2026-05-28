/**
 * Homescreen — De-Launcher
 *
 * The main launcher screen. Features:
 * - Large minimal clock
 * - Grid of allowed (whitelisted) apps only
 * - Dock at the bottom
 * - Swipe up to open app drawer
 */
import React, { useCallback, useState } from "react";
import { View, StyleSheet, Pressable, Text, StatusBar as RNStatusBar } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { router, useLocalSearchParams, Redirect } from "expo-router";
import { Settings, ShieldAlert, Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing, layout } from "@/src/theme/tokens";
import { Clock } from "@/src/components/Clock";
import { AppGrid } from "@/src/components/AppGrid";
import { Dock } from "@/src/components/Dock";
import { ContextMenu } from "@/src/components/ContextMenu";
import { useAppStore } from "@/src/store/appStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { launchApp } from "@/src/services/appManager";
import { signalNavigation } from "./_layout";
import { AppInfo } from "@/src/types/app";

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const statusBarHeight = RNStatusBar.currentHeight ?? insets.top ?? 24;
  const showClock = useSettingsStore((s) => s.showClock);
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);
  const installedApps = useAppStore((s) => s.installedApps);
  const allowedPackages = useAppStore((s) => s.allowedPackages);
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const { blocked_pkg } = useLocalSearchParams<{ blocked_pkg?: string }>();
  const [showBlockedBanner, setShowBlockedBanner] = useState(false);
  const [blockedAppLabel, setBlockedAppLabel] = useState("");

  // Listen for blocked app deep links
  React.useEffect(() => {
    if (blocked_pkg && typeof blocked_pkg === "string" && installedApps.length > 0) {
      const focusState = useAppStore.getState().getAppFocusState(blocked_pkg);
      if (focusState === "intent_pause") {
        router.push(`/intent-pause?pkg=${blocked_pkg}` as any);
      } else {
        const app = installedApps.find((a) => a.packageName === blocked_pkg);
        setBlockedAppLabel(app?.label || blocked_pkg);
        setShowBlockedBanner(true);
        const timer = setTimeout(() => setShowBlockedBanner(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [blocked_pkg, installedApps]);

  const panGesture = React.useMemo(() => {
    return Gesture.Pan()
      .activeOffsetY(20)
      .onEnd((e) => {
        if (e.velocityY > 500 || e.translationY > 50) {
          router.push("/search" as any);
        }
      });
  }, []);

  const allowedApps = React.useMemo(() => {
    const appsMap = new Map(installedApps.map((app) => [app.packageName, app]));
    return allowedPackages
      .map((pkg) => appsMap.get(pkg))
      .filter((app): app is AppInfo => !!app);
  }, [installedApps, allowedPackages]);

  const handleAppPress = useCallback((app: AppInfo) => {
    launchApp(app.packageName);
  }, []);

  const handleAppLongPress = useCallback((app: AppInfo) => {
    setSelectedApp(app);
  }, []);

  if (!hasCompletedOnboarding) {
    return <Redirect href={"/onboarding" as any} />;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Blocked App Banner */}
        {showBlockedBanner && (
          <Animated.View
            entering={FadeInUp.duration(300).springify()}
            style={[styles.blockedBanner, { top: statusBarHeight + spacing.sm, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: colors.error }]}
          >
            <ShieldAlert size={20} color={colors.error} />
            <Text style={[styles.blockedBannerText, { color: colors.textPrimary }]}>
              <Text style={{ fontFamily: typography.family.bold }}>{blockedAppLabel}</Text> is not in Focus apps
            </Text>
          </Animated.View>
        )}

        {/* Clock */}
        {showClock && (
          <View style={{ paddingTop: statusBarHeight }}>
            <Clock />
          </View>
        )}

        {/* App Grid — only allowed apps */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(300)}
          style={[
            styles.gridContainer,
            !showClock && { paddingTop: statusBarHeight + 80 },
          ]}
        >
          <AppGrid
            apps={allowedApps}
            onPress={handleAppPress}
            onLongPress={handleAppLongPress}
          />
        </Animated.View>

        {/* Dock */}
        <Dock onLongPress={handleAppLongPress} />

        {/* Top Right Controls */}
        <Animated.View
          entering={FadeIn.delay(400)}
          style={[styles.topControls, { top: statusBarHeight + spacing.sm, elevation: 10 }]}
        >
          <Pressable
            onPress={() => {
              signalNavigation();
              router.push("/search" as any);
            }}
            hitSlop={12}
            style={styles.iconPressable}
          >
            <Search size={22} color={colors.textTertiary} />
          </Pressable>
          <Pressable
            onPress={() => {
              signalNavigation();
              router.push("/settings");
            }}
            hitSlop={12}
            style={styles.iconPressable}
          >
            <Settings size={22} color={colors.textTertiary} />
          </Pressable>
        </Animated.View>

        {/* Long Press Context Menu */}
        <ContextMenu 
          selectedApp={selectedApp} 
          onClose={() => setSelectedApp(null)} 
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blockedBanner: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    zIndex: 20,
    elevation: 5,
  },
  blockedBannerText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
  },
  topControls: {
    position: "absolute",
    right: spacing.xl,
    flexDirection: "row",
    gap: spacing.md,
    zIndex: 10,
  },
  iconPressable: {
    padding: spacing.xs,
    borderRadius: 999,
  },
  gridContainer: {
    flex: 1,
    marginBottom: layout.dockHeight,
  },
});
