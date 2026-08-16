/**
 * Homescreen — De-Launcher
 *
 * The main launcher screen. Features:
 * - Large minimal clock
 * - Customizable Home Search Widget
 * - Daily Focus & Streak Heatmap Widget
 * - Responsive Grid of allowed apps and folders
 * - Floating Frosted Capsule Dock at the bottom
 * - Swipe up/down gestures for Command Bar & Drawer
 */
import React, { useCallback, useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  StatusBar as RNStatusBar,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { router, useLocalSearchParams, Redirect } from "expo-router";
import { Settings, ShieldAlert, Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing, layout } from "@/src/theme/tokens";
import { Clock } from "@/src/components/Clock";
import { AppGrid } from "@/src/components/AppGrid";
import { Dock } from "@/src/components/Dock";
import { ContextMenu } from "@/src/components/ContextMenu";
import { HomeSearchWidget } from "@/src/components/HomeSearchWidget";
import { TodoStreakWidget } from "@/src/components/TodoStreakWidget";
import { FolderModal } from "@/src/components/FolderModal";
import { useAppStore } from "@/src/store/appStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { launchApp } from "@/src/services/appManager";
import { signalNavigation } from "./_layout";
import { AppInfo, FolderInfo } from "@/src/types/app";

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const statusBarHeight = RNStatusBar.currentHeight ?? insets.top ?? 24;

  const showClock = useSettingsStore((s) => s.showClock);
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  const installedApps = useAppStore((s) => s.installedApps);
  const allowedPackages = useAppStore((s) => s.allowedPackages);
  const folders = useAppStore((s) => s.folders) || [];
  const isAppWithinSchedule = useAppStore((s) => s.isAppWithinSchedule);

  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderInfo | null>(null);

  const { blocked_pkg } = useLocalSearchParams<{ blocked_pkg?: string }>();
  const [showBlockedBanner, setShowBlockedBanner] = useState(false);
  const [blockedAppLabel, setBlockedAppLabel] = useState("");

  // Listen for blocked app deep links
  useEffect(() => {
    if (blocked_pkg && typeof blocked_pkg === "string" && installedApps.length > 0) {
      const focusState = useAppStore.getState().getAppFocusState(blocked_pkg);
      if (focusState === "intent_pause") {
        router.push(`/intent-pause?pkg=${blocked_pkg}` as any);
      } else {
        const app = installedApps.find((a) => a.packageName === blocked_pkg);
        setBlockedAppLabel(app?.label || blocked_pkg);
        setShowBlockedBanner(true);
        const timer = setTimeout(() => setShowBlockedBanner(false), 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [blocked_pkg, installedApps]);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetY(35)
      .failOffsetX([-25, 25])
      .onEnd((e) => {
        if (e.velocityY > 600 || e.translationY > 70) {
          router.push("/search" as any);
        } else if (e.velocityY < -600 || e.translationY < -70) {
          router.push("/drawer" as any);
        }
      });
  }, []);

  const allowedApps = useMemo(() => {
    const appsMap = new Map(installedApps.map((app) => [app.packageName, app]));
    return allowedPackages
      .map((pkg) => appsMap.get(pkg))
      .filter((app): app is AppInfo => !!app);
  }, [installedApps, allowedPackages]);

  const handleAppPress = useCallback(
    (app: AppInfo) => {
      const schedule = isAppWithinSchedule(app.packageName);
      if (!schedule.allowed) {
        if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        router.push(`/intent-pause?pkg=${app.packageName}&reason=${encodeURIComponent(schedule.reason || "")}` as any);
        return;
      }
      launchApp(app.packageName);
    },
    [isAppWithinSchedule, hapticEnabled]
  );

  const handleAppLongPress = useCallback((app: AppInfo) => {
    setSelectedApp(app);
  }, []);

  const handleFolderPress = useCallback((folder: FolderInfo) => {
    setSelectedFolder(folder);
  }, []);

  const handleOpenSearch = useCallback(() => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signalNavigation(1000);
    router.push("/search" as any);
  }, [hapticEnabled]);

  const handleOpenSettings = useCallback(() => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signalNavigation(1000);
    router.push("/settings");
  }, [hapticEnabled]);

  if (!hasCompletedOnboarding) {
    return <Redirect href={"/onboarding" as any} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Gesture-driven Home Content — buttons are INSIDE the gesture view
          so they share the same native touch hierarchy on Android.
          React Native's Pressable always wins over RNGH Pan on taps
          because Pan requires 35px vertical movement to activate. */}
      <GestureDetector gesture={panGesture}>
        <View style={[styles.contentArea, { paddingTop: statusBarHeight + 44 }]}>
          {/* Top Header Bar — absolute positioned inside gesture view,
              high zIndex ensures it draws on top and receives taps first */}
          <View
            pointerEvents="box-none"
            style={[
              styles.headerBar,
              {
                top: statusBarHeight + spacing.xs,
              },
            ]}
          >
            <View style={styles.headerLeftSpacer} />

            <View style={styles.topControls}>
              <Pressable
                onPress={handleOpenSearch}
                hitSlop={16}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Open search and command bar"
              >
                <Search size={22} color={colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={handleOpenSettings}
                hitSlop={16}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Open settings"
              >
                <Settings size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Clock Widget */}
          {showClock && (
            <View style={styles.clockWrapper}>
              <Clock />
            </View>
          )}

          {/* Customizable Search Bar Widget */}
          <HomeSearchWidget />

          {/* Daily Focus Tasks & Streak Widget */}
          <TodoStreakWidget />

          {/* App & Folder Grid */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(150)}
            style={styles.gridContainer}
          >
            <AppGrid
              apps={allowedApps}
              folders={folders}
              onPress={handleAppPress}
              onLongPress={handleAppLongPress}
              onFolderPress={handleFolderPress}
            />
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Blocked App Banner */}
      {showBlockedBanner && (
        <Animated.View
          entering={FadeInUp.duration(300).springify()}
          style={[
            styles.blockedBanner,
            {
              top: statusBarHeight + 52,
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              borderColor: colors.error,
            },
          ]}
        >
          <ShieldAlert size={18} color={colors.error} />
          <Text style={[styles.blockedBannerText, { color: colors.textPrimary }]}>
            <Text style={{ fontFamily: typography.family.bold }}>{blockedAppLabel}</Text> is not in Focus apps
          </Text>
        </Animated.View>
      )}

      {/* Dock */}
      <Dock onLongPress={handleAppLongPress} />

      {/* Context Menu Bottom Sheet */}
      <ContextMenu
        selectedApp={selectedApp}
        onClose={() => setSelectedApp(null)}
      />

      {/* Folder Contents Modal */}
      <FolderModal
        folder={selectedFolder}
        onClose={() => setSelectedFolder(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 100,
    elevation: 10,
  },
  headerLeftSpacer: {
    flex: 1,
  },
  topControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  contentArea: {
    flex: 1,
  },
  clockWrapper: {
    paddingTop: spacing.xs,
  },
  gridContainer: {
    flex: 1,
    marginBottom: layout.dockHeight + spacing.sm,
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
    zIndex: 90,
    elevation: 8,
  },
  blockedBannerText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
  },
});
