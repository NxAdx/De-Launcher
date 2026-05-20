/**
 * App Drawer — De-Launcher
 *
 * Full list of installed apps with search, filter, and allow/block toggle.
 * Presented as a modal (slide from bottom).
 */
import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Switch } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { ChevronDown, ShieldOff, Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing, radii } from "@/src/theme/tokens";
import { SearchBar } from "@/src/components/SearchBar";
import { AppIcon } from "@/src/components/AppIcon";
import { useAppStore } from "@/src/store/appStore";
import { AppInfo } from "@/src/types/app";
import { launchApp, KNOWN_DISTRACTION_PACKAGES } from "@/src/services/appManager";

type FilterMode = "all" | "allowed" | "blocked";

export default function DrawerScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const installedApps = useAppStore((s) => s.installedApps);
  const allowedPackages = useAppStore((s) => s.allowedPackages);
  const toggleAppAllowed = useAppStore((s) => s.toggleAppAllowed);

  const filteredApps = useMemo(() => {
    let apps = installedApps;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      apps = apps.filter(
        (app) =>
          app.label.toLowerCase().includes(q) ||
          app.packageName.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filterMode === "allowed") {
      apps = apps.filter((app) => allowedPackages.includes(app.packageName));
    } else if (filterMode === "blocked") {
      apps = apps.filter((app) => !allowedPackages.includes(app.packageName));
    }

    return apps;
  }, [installedApps, searchQuery, filterMode, allowedPackages]);

  const handleAppPress = useCallback((app: AppInfo) => {
    launchApp(app.packageName);
    router.back();
  }, []);

  const handleToggle = useCallback(
    (packageName: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleAppAllowed(packageName);
    },
    [toggleAppAllowed]
  );

  const isDistraction = useCallback(
    (packageName: string) => KNOWN_DISTRACTION_PACKAGES.includes(packageName),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: AppInfo }) => {
      const isAllowed = allowedPackages.includes(item.packageName);
      const distraction = isDistraction(item.packageName);

      return (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.appRow,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.02)"
                : "rgba(0,0,0,0.02)",
            },
          ]}
        >
          <Pressable
            style={styles.appInfo}
            onPress={() => handleAppPress(item)}
          >
            <AppIcon
              app={item}
              onPress={handleAppPress}
              size={44}
              showLabel={false}
            />
            <View style={styles.appTextContainer}>
              <Text
                style={[styles.appLabel, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              {distraction && (
                <View style={styles.distractionBadge}>
                  <ShieldOff size={10} color={colors.warning} />
                  <Text style={[styles.distractionText, { color: colors.warning }]}>
                    Distraction
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
          <Switch
            value={isAllowed}
            onValueChange={() => handleToggle(item.packageName)}
            trackColor={{
              false: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              true: colors.accent,
            }}
            thumbColor="#FFFFFF"
          />
        </Animated.View>
      );
    },
    [allowedPackages, colors, isDark, handleAppPress, handleToggle, isDistraction]
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={styles.header}
      >
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <ChevronDown size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          All Apps
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.dismissAll();
            router.push("/settings");
          }}
          hitSlop={16}
        >
          <Settings size={24} color={colors.textPrimary} />
        </Pressable>
      </Animated.View>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery("")}
      />

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(["all", "allowed", "blocked"] as FilterMode[]).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterMode(mode);
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filterMode === mode
                    ? colors.accent
                    : isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    filterMode === mode ? "#FFFFFF" : colors.textSecondary,
                },
              ]}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Count */}
      <Text style={[styles.countText, { color: colors.textTertiary }]}>
        {filteredApps.length} app{filteredApps.length !== 1 ? "s" : ""}
      </Text>

      {/* App List */}
      <FlashList
        data={filteredApps}
        renderItem={renderItem}
        keyExtractor={(item) => item.packageName}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: typography.family.semiBold,
    fontSize: typography.size.lg,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
  },
  filterText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
  },
  countText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.xs,
  },
  appInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
  },
  appTextContainer: {
    flex: 1,
  },
  appLabel: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.md,
  },
  distractionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  distractionText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
  },
});
