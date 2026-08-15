/**
 * App Drawer — De-Launcher
 *
 * Full list of installed apps with search, filter, and comprehensive focus controls.
 * Presented as a modal (slide from bottom).
 */
import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { ChevronDown, ShieldOff, Settings, Clock } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing, radii } from "@/src/theme/tokens";
import { SearchBar } from "@/src/components/SearchBar";
import { AppIcon } from "@/src/components/AppIcon";
import { ContextMenu } from "@/src/components/ContextMenu";
import { useAppStore } from "@/src/store/appStore";
import { AppInfo } from "@/src/types/app";
import { launchApp, isKnownDistraction } from "@/src/services/appManager";
import { signalNavigation } from "./_layout";

type FilterMode = "all" | "allowed" | "blocked";

export default function DrawerScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const installedApps = useAppStore((s) => s.installedApps);
  const getAppFocusState = useAppStore((s) => s.getAppFocusState);
  const allowedPackages = useAppStore((s) => s.allowedPackages);
  const scheduleRules = useAppStore((s) => s.scheduleRules);

  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);

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
    signalNavigation();
    router.back();
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: AppInfo }) => {
      const state = getAppFocusState(item.packageName);
      const distraction = isKnownDistraction(item.packageName);
      const schedule = scheduleRules[item.packageName]?.scheduleType;

      return (
        <Animated.View
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
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSelectedApp(item);
            }}
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
              {(distraction || state === "intent_pause" || (schedule && schedule !== "always_allowed")) && (
                <View style={styles.distractionBadge}>
                  {schedule === "work_hours" ? (
                    <>
                      <Clock size={10} color={colors.accent} />
                      <Text style={[styles.distractionText, { color: colors.accent }]}>
                        Work Hours
                      </Text>
                    </>
                  ) : schedule === "evening_only" ? (
                    <>
                      <Clock size={10} color={colors.accent} />
                      <Text style={[styles.distractionText, { color: colors.accent }]}>
                        Evening Only
                      </Text>
                    </>
                  ) : state === "intent_pause" ? (
                    <>
                      <ShieldOff size={10} color={colors.warning} />
                      <Text style={[styles.distractionText, { color: colors.warning }]}>
                        Intent Pause
                      </Text>
                    </>
                  ) : (
                    <>
                      <ShieldOff size={10} color={colors.error} />
                      <Text style={[styles.distractionText, { color: colors.error }]}>
                        Distraction
                      </Text>
                    </>
                  )}
                </View>
              )}
            </View>
          </Pressable>

          <Pressable
            hitSlop={12}
            onPress={() => setSelectedApp(item)}
            style={styles.stateButton}
          >
            <Text
              style={[
                styles.stateButtonText,
                {
                  color:
                    state === "allowed"
                      ? colors.accent
                      : state === "intent_pause"
                      ? colors.warning
                      : colors.textTertiary,
                },
              ]}
            >
              {state === "allowed"
                ? "Allowed"
                : state === "intent_pause"
                ? "Paused"
                : "Hidden"}
            </Text>
          </Pressable>
        </Animated.View>
      );
    },
    [getAppFocusState, colors, isDark, handleAppPress, scheduleRules]
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, paddingTop: insets.top },
      ]}
    >
      {/* Pull Indicator */}
      <View style={styles.pullIndicator} />

      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={styles.header}
      >
        <Pressable
          onPress={() => {
            signalNavigation();
            router.back();
          }}
          hitSlop={16}
        >
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
                    filterMode === mode ? "#0A0A0A" : colors.textSecondary,
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
      {filteredApps.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.textTertiary }]}>
            No apps found
          </Text>
        </View>
      ) : (
        <FlashList
          data={filteredApps}
          renderItem={renderItem}
          keyExtractor={(item) => item.packageName}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Context Menu Bottom Sheet */}
      <ContextMenu
        selectedApp={selectedApp}
        onClose={() => setSelectedApp(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pullIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing["4xl"],
  },
  emptyStateText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
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
    paddingBottom: 120,
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
  stateButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  stateButtonText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
  },
});
