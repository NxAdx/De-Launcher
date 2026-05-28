import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, Switch, TextInput } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import { useAppStore } from "@/src/store/appStore";
import { AppInfo } from "@/src/types/app";

export default function AppsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const installedApps = useAppStore((s) => s.installedApps);
  const allowedPackages = useAppStore((s) => s.allowedPackages);
  const setAppFocusState = useAppStore((s) => s.setAppFocusState);

  const [search, setSearch] = useState("");

  const filteredApps = installedApps
    .filter(app => app.label.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.label.localeCompare(b.label));

  const renderAppItem = useCallback(
    ({ item }: { item: AppInfo }) => {
      const isAllowed = allowedPackages.includes(item.packageName);
      return (
        <View style={styles.appRow}>
          <View style={styles.appInfo}>
            <Text style={[styles.appLabel, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
          <Switch
            value={isAllowed}
            onValueChange={(val) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAppFocusState(item.packageName, val ? "allowed" : "blocked");
            }}
            trackColor={{ false: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
      );
    },
    [allowedPackages, colors, setAppFocusState, isDark]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Choose Apps</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Select essential apps you want on your home screen. Other apps will be hidden.
        </Text>
      </View>

      <TextInput
        style={[styles.searchInput, { color: colors.textPrimary, backgroundColor: 'rgba(255,255,255,0.05)' }]}
        placeholder="Search apps..."
        placeholderTextColor={colors.textTertiary}
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.listContainer}>
        <FlashList
          data={filteredApps}
          renderItem={renderAppItem}
          keyExtractor={(item) => item.packageName}
          extraData={{ allowedPackages, colors }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => router.push("/onboarding/finish" as any)}
        >
          <Text style={[styles.buttonText, { color: "#0A0A0A" }]}>Next Step</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.family.bold,
    fontSize: typography.size["3xl"],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: 24,
  },
  searchInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    marginBottom: spacing.md,
  },
  listContainer: {
    flex: 1,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    height: 64,
  },
  appInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  appLabel: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
  },
  footer: {
    paddingTop: spacing.lg,
  },
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
  },
});
