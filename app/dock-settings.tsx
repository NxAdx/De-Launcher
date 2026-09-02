import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { ArrowLeft, Search, GripVertical } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";

import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import { useAppStore } from "@/src/store/appStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { getCachedSystemIcon } from "@/src/services/appManager";
import { signalNavigation } from "./_layout";
import { AppInfo } from "@/src/types/app";

export default function DockSettingsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const installedApps = useAppStore((s) => s.installedApps);
  const dockPackages = useAppStore((s) => s.dockPackages);
  const addToDock = useAppStore((s) => s.addToDock);
  const removeFromDock = useAppStore((s) => s.removeFromDock);
  const reorderDock = useAppStore((s) => s.reorderDock);
  const maxDockIcons = useSettingsStore((s) => s.maxDockIcons);

  const displayData = useMemo(() => {
    const docked = dockPackages
      .map((pkg) => installedApps.find((a) => a.packageName === pkg))
      .filter(Boolean) as AppInfo[];

    let others = installedApps.filter(
      (a) => !dockPackages.includes(a.packageName)
    );

    if (query) {
      const lowerQuery = query.toLowerCase();
      others = others.filter(
        (a) =>
          a.label.toLowerCase().includes(lowerQuery) ||
          a.packageName.toLowerCase().includes(lowerQuery)
      );
      const matchingDocked = docked.filter(
        (a) =>
          a.label.toLowerCase().includes(lowerQuery) ||
          a.packageName.toLowerCase().includes(lowerQuery)
      );
      return [...matchingDocked, ...others];
    }

    others.sort((a, b) => a.label.localeCompare(b.label));
    return [...docked, ...others];
  }, [dockPackages, installedApps, query]);

  const handleDragEnd = ({ data }: { data: AppInfo[] }) => {
    if (query) return;

    const newDockOrder = data
      .filter((app) => dockPackages.includes(app.packageName))
      .map((app) => app.packageName);

    reorderDock(newDockOrder);
  };

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<AppInfo>) => {
      const isDocked = dockPackages.includes(item.packageName);
      const iconUri = getCachedSystemIcon(item.packageName) || item.icon;

      return (
        <ScaleDecorator>
          <View
            style={[
              styles.appRow,
              {
                backgroundColor: isActive
                  ? isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.06)"
                  : isDark
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(0,0,0,0.02)",
                opacity: isActive ? 0.9 : 1,
              },
            ]}
          >
            {isDocked && !query ? (
              <Pressable
                onLongPress={drag}
                delayLongPress={200}
                style={styles.dragHandle}
                hitSlop={8}
              >
                <GripVertical size={20} color={colors.textTertiary} />
              </Pressable>
            ) : (
              <View style={styles.dragPlaceholder} />
            )}

            <View style={styles.appInfo}>
              <Image
                source={{
                  uri:
                    iconUri?.startsWith("data:") || iconUri?.startsWith("file:")
                      ? iconUri
                      : iconUri
                      ? `data:image/png;base64,${iconUri}`
                      : undefined,
                }}
                style={styles.appIcon}
              />
              <View style={styles.appTextContainer}>
                <Text
                  style={[styles.appLabel, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
            </View>

            <Switch
              value={isDocked}
              onValueChange={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (isDocked) {
                  removeFromDock(item.packageName);
                } else {
                  if (dockPackages.length >= maxDockIcons) {
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Warning
                    );
                    return;
                  }
                  addToDock(item.packageName);
                }
              }}
              disabled={!isDocked && dockPackages.length >= maxDockIcons}
              trackColor={{
                false: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                true: colors.accent,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </ScaleDecorator>
      );
    },
    [dockPackages, maxDockIcons, query, isDark, colors, removeFromDock, addToDock]
  );

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: colors.surface, paddingTop: insets.top },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <Pressable
          onPress={() => {
            signalNavigation();
            router.back();
          }}
          hitSlop={16}
        >
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Configure Dock
        </Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      {/* Search Bar & Capacity Indicator */}
      <View style={styles.topSection}>
        <View style={styles.capacityContainer}>
          {Array.from({ length: maxDockIcons }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.capacityDot,
                {
                  backgroundColor:
                    i < dockPackages.length
                      ? colors.accent
                      : isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                },
              ]}
            />
          ))}
          <Text style={[styles.capacityText, { color: colors.textTertiary }]}>
            {dockPackages.length} / {maxDockIcons} slots
          </Text>
        </View>

        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.03)",
            },
          ]}
        >
          <Search
            size={18}
            color={colors.textTertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search apps..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
        </View>
      </View>

      {/* List */}
      <DraggableFlatList
        data={displayData}
        onDragEnd={handleDragEnd}
        keyExtractor={(item) => item.packageName}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<View style={{ height: Math.max(140, insets.bottom + 120) }} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
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
  headerTitle: {
    fontFamily: typography.family.semiBold,
    fontSize: typography.size.lg,
  },
  topSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  capacityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  capacityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  capacityText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    marginLeft: spacing.xs,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.xs,
  },
  dragHandle: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  dragPlaceholder: {
    width: 24,
  },
  appInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
  },
  appIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  appTextContainer: {
    flex: 1,
  },
  appLabel: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.md,
  },
});
