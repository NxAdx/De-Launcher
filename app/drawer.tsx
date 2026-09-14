/**
 * App Drawer — De-Launcher
 *
 * Full list of installed apps with search, filter, and comprehensive focus controls.
 * Presented as a modal (slide from bottom).
 */
import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, Platform } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { ChevronDown, ShieldOff, Settings, Clock, Pin, EyeOff } from "lucide-react-native";
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

interface DrawerAppRowProps {
  item: AppInfo;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  state: string;
  distraction: boolean;
  schedule?: string;
  isHome: boolean;
  isHidden: boolean;
  onPress: (app: AppInfo) => void;
  onSelect: (app: AppInfo) => void;
}

const DrawerAppRow = React.memo(function DrawerAppRow({
  item,
  isDark,
  colors,
  state,
  distraction,
  schedule,
  isHome,
  isHidden,
  onPress,
  onSelect,
}: DrawerAppRowProps) {
  return (
    <View
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
        onPress={() => onPress(item)}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSelect(item);
        }}
      >
        <AppIcon
          app={item}
          onPress={onPress}
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
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
            {isHome && (
              <View style={[styles.distractionBadge, { backgroundColor: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }]}>
                <Pin size={10} color={colors.accent} strokeWidth={2.4} />
                <Text style={[styles.distractionText, { color: colors.accent }]}>
                  Home
                </Text>
              </View>
            )}
            {isHidden && (
              <View style={[styles.distractionBadge, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }]}>
                <EyeOff size={10} color={colors.textTertiary} strokeWidth={2.4} />
                <Text style={[styles.distractionText, { color: colors.textTertiary }]}>
                  Hidden
                </Text>
              </View>
            )}
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
        </View>
      </Pressable>

      <Pressable
        hitSlop={12}
        onPress={() => onSelect(item)}
        style={styles.stateButton}
      >
        <Text
          style={[
            styles.stateButtonText,
            {
              color:
                isHidden
                  ? colors.textTertiary
                  : state === "allowed"
                  ? colors.accent
                  : state === "intent_pause"
                  ? colors.warning
                  : colors.textTertiary,
            },
          ]}
        >
          {isHidden
            ? "Hidden"
            : state === "allowed"
            ? "Allowed"
            : state === "intent_pause"
            ? "Paused"
            : "Shielded"}
        </Text>
      </Pressable>
    </View>
  );
});

export default function DrawerScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const installedApps = useAppStore((s) => s.installedApps);
  const rawHiddenPackages = useAppStore((s) => s.hiddenPackages);
  const hiddenPackages = useMemo(() => rawHiddenPackages || [], [rawHiddenPackages]);
  const getAppFocusState = useAppStore((s) => s.getAppFocusState);
  const allowedPackages = useAppStore((s) => s.allowedPackages);
  const scheduleRules = useAppStore((s) => s.scheduleRules);
  const isAppWithinSchedule = useAppStore((s) => s.isAppWithinSchedule);
  const hasActiveExemption = useAppStore((s) => s.hasActiveExemption);

  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);

  const filteredApps = useMemo(() => {
    let apps = installedApps;

    // Search filter: searching immediately reveals all matching apps even if hidden
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      apps = apps.filter(
        (app) =>
          app.label.toLowerCase().includes(q) ||
          app.packageName.toLowerCase().includes(q)
      );
    } else {
      // Default browsing: filter out user-hidden apps
      if (hiddenPackages.length > 0) {
        apps = apps.filter((app) => !hiddenPackages.includes(app.packageName));
      }
    }

    // Category filter
    if (filterMode === "allowed") {
      apps = apps.filter((app) => allowedPackages.includes(app.packageName));
    } else if (filterMode === "blocked") {
      apps = apps.filter((app) => !allowedPackages.includes(app.packageName));
    }

    // Guaranteed deterministic alphabetical order with case insensitivity and stable tie-breaking
    return apps.slice().sort((a, b) => {
      const cmp = a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
      if (cmp !== 0) return cmp;
      return a.packageName.localeCompare(b.packageName);
    });
  }, [installedApps, searchQuery, filterMode, allowedPackages, hiddenPackages]);

  const handleAppPress = useCallback(
    (app: AppInfo) => {
      const schedule = isAppWithinSchedule(app.packageName);
      if (!schedule.allowed) {
        signalNavigation();
        router.push(
          `/intent-pause?pkg=${app.packageName}&reason=${encodeURIComponent(
            schedule.reason || ""
          )}` as any
        );
        return;
      }

      const state = getAppFocusState(app.packageName);
      const distraction = isKnownDistraction(app.packageName);
      const hasExemption = hasActiveExemption(app.packageName);

      if (
        (state === "intent_pause" || state === "blocked" || distraction) &&
        !hasExemption
      ) {
        signalNavigation();
        router.push(`/intent-pause?pkg=${app.packageName}` as any);
        return;
      }

      launchApp(app.packageName);
      signalNavigation();
      router.back();
    },
    [isAppWithinSchedule, getAppFocusState, hasActiveExemption]
  );

  const handleSelectApp = useCallback((app: AppInfo) => {
    setSelectedApp(app);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: AppInfo }) => {
      const state = getAppFocusState(item.packageName);
      const distraction = isKnownDistraction(item.packageName);
      const schedule = scheduleRules[item.packageName]?.scheduleType;
      const isHome = allowedPackages.includes(item.packageName);
      const isHidden = hiddenPackages.includes(item.packageName);

      return (
        <DrawerAppRow
          item={item}
          isDark={isDark}
          colors={colors}
          state={state}
          distraction={distraction}
          schedule={schedule}
          isHome={isHome}
          isHidden={isHidden}
          onPress={handleAppPress}
          onSelect={handleSelectApp}
        />
      );
    },
    [getAppFocusState, colors, isDark, handleAppPress, handleSelectApp, scheduleRules, allowedPackages, hiddenPackages]
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
        entering={FadeInDown.duration(150)}
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

      {/* Count & Hidden Apps Status */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, marginBottom: spacing.xs }}>
        <Text style={[styles.countText, { color: colors.textTertiary, paddingHorizontal: 0, marginBottom: 0 }]}>
          {filteredApps.length} app{filteredApps.length !== 1 ? "s" : ""}
        </Text>
        {hiddenPackages.length > 0 && !searchQuery.trim() && (
          <Text style={{ fontFamily: typography.family.medium, fontSize: typography.size.xs, color: colors.textTertiary }}>
            {hiddenPackages.length} hidden · Search to reveal
          </Text>
        )}
      </View>

      {/* App List */}
      {filteredApps.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.textTertiary }]}>
            No apps found
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredApps}
          renderItem={renderItem}
          keyExtractor={(item) => item.packageName}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={9}
          removeClippedSubviews={Platform.OS === "android"}
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
    minHeight: 56,
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
