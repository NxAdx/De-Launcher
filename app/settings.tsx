/**
 * Settings Screen — De-Launcher
 *
 * Launcher configuration: theme, grid, labels, clock, dock management.
 * Designed with a clean, grouped section pattern.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
} from "react-native";
import Animated, { FadeIn, FadeInRight } from "react-native-reanimated";
import { router } from "expo-router";
import {
  ArrowLeft,
  Sun,
  Moon,
  Grid3x3,
  Type,
  Clock as ClockIcon,
  Vibrate,
  Palette,
  Home,
  Image as ImageIcon,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing, radii } from "@/src/theme/tokens";
import { useSettingsStore } from "@/src/store/settingsStore";
import { getAvailableIconPacks, promptSetDefaultLauncher, changeWallpaper } from "@/src/services/appManager";
import { IconPackInfo } from "@/modules/de-launcher-native";

// ─── Setting Row Components ─────────────────────────────

function SettingRow({
  icon,
  label,
  description,
  right,
  onPress,
  colors,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  right: React.ReactNode;
  onPress?: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.settingRow,
        {
          backgroundColor: isDark
            ? "rgba(255,255,255,0.03)"
            : "rgba(0,0,0,0.03)",
        },
      ]}
    >
      <View style={styles.settingLeft}>
        {icon}
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
            {label}
          </Text>
          {description && (
            <Text
              style={[
                styles.settingDescription,
                { color: colors.textTertiary },
              ]}
            >
              {description}
            </Text>
          )}
        </View>
      </View>
      {right}
    </Pressable>
  );
}

function SectionHeader({
  title,
  colors,
}: {
  title: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.accent }]}>
      {title}
    </Text>
  );
}

// ─── Main Component ─────────────────────────────────────

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [iconPacks, setIconPacks] = useState<IconPackInfo[]>([]);

  const {
    gridColumns,
    showLabels,
    showClock,
    hapticFeedback,
    activeIconPack,
    setGridColumns,
    setShowLabels,
    setShowClock,
    setHapticFeedback,
    setActiveIconPack,
  } = useSettingsStore();

  useEffect(() => {
    const loadIconPacks = async () => {
      try {
        const packs = await getAvailableIconPacks();
        setIconPacks(packs);
      } catch (error) {
        console.error("Failed to load icon packs:", error);
      }
    };

    loadIconPacks();
  }, []);

  const handleGridChange = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Cycle: 3 → 4 → 5 → 3
    const next = gridColumns >= 5 ? 3 : gridColumns + 1;
    setGridColumns(next);
  }, [gridColumns, setGridColumns]);

  const handleIconPackSelect = useCallback(
    (packageName: string | null) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveIconPack(packageName);
    },
    [setActiveIconPack]
  );

  const handleSetDefaultLauncher = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await promptSetDefaultLauncher();
  }, []);

  const handleChangeWallpaper = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await changeWallpaper();
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={styles.header}
      >
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Settings
        </Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Appearance ─── */}
        <SectionHeader title="APPEARANCE" colors={colors} />

        <SettingRow
          icon={
            isDark ? (
              <Moon size={20} color={colors.textSecondary} />
            ) : (
              <Sun size={20} color={colors.textSecondary} />
            )
          }
          label="Dark Mode"
          description={isDark ? "OLED-optimized dark theme" : "Light theme"}
          right={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{
                false: "rgba(0,0,0,0.1)",
                true: colors.accent,
              }}
              thumbColor="#FFFFFF"
            />
          }
          colors={colors}
          isDark={isDark}
        />

        <SettingRow
          icon={<Grid3x3 size={20} color={colors.textSecondary} />}
          label="Grid Columns"
          description={`${gridColumns} columns per row`}
          right={
            <Pressable onPress={handleGridChange} style={styles.gridButton}>
              <Text style={[styles.gridButtonText, { color: colors.accent }]}>
                {gridColumns}
              </Text>
            </Pressable>
          }
          onPress={handleGridChange}
          colors={colors}
          isDark={isDark}
        />

        <SettingRow
          icon={<ImageIcon size={20} color={colors.textSecondary} />}
          label="Change Wallpaper"
          description="Choose a system wallpaper"
          right={
            <Pressable onPress={handleChangeWallpaper} style={styles.gridButton}>
              <ImageIcon size={16} color={colors.accent} />
            </Pressable>
          }
          onPress={handleChangeWallpaper}
          colors={colors}
          isDark={isDark}
        />

        {/* ─── Icon Packs ─── */}
        <SectionHeader title="ICON PACKS" colors={colors} />
        {iconPacks.length > 0 ? (
          <>
            <Pressable
              onPress={() => handleIconPackSelect(null)}
              style={[
                styles.settingRow,
                {
                  backgroundColor:
                    activeIconPack === null
                      ? colors.accent
                      : isDark
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,0,0,0.03)",
                },
              ]}
            >
              <View style={styles.settingLeft}>
                <Palette size={20} color={colors.textSecondary} />
                <View style={styles.settingTextContainer}>
                  <Text
                    style={[
                      styles.settingLabel,
                      {
                        color:
                          activeIconPack === null
                            ? colors.bg
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    Default Icons
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      {
                        color:
                          activeIconPack === null
                            ? "rgba(0,0,0,0.6)"
                            : colors.textTertiary,
                      },
                    ]}
                  >
                    System default app icons
                  </Text>
                </View>
              </View>
            </Pressable>

            {iconPacks.map((pack) => (
              <Pressable
                key={pack.packageName}
                onPress={() => handleIconPackSelect(pack.packageName)}
                style={[
                  styles.settingRow,
                  {
                    backgroundColor:
                      activeIconPack === pack.packageName
                        ? colors.accent
                        : isDark
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(0,0,0,0.03)",
                  },
                ]}
              >
                <View style={styles.settingLeft}>
                  <Palette size={20} color={colors.textSecondary} />
                  <View style={styles.settingTextContainer}>
                    <Text
                      style={[
                        styles.settingLabel,
                        {
                          color:
                            activeIconPack === pack.packageName
                              ? colors.bg
                              : colors.textPrimary,
                        },
                      ]}
                    >
                      {pack.label}
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        {
                          color:
                            activeIconPack === pack.packageName
                              ? "rgba(0,0,0,0.6)"
                              : colors.textTertiary,
                        },
                      ]}
                    >
                      {pack.mappingCount} custom icons
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </>
        ) : (
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0,0,0,0.03)",
                borderColor: colors.border,
              },
            ]}
          >
            <Palette size={20} color={colors.accent} style={styles.infoCardIcon} />
            <View style={styles.infoCardTextContainer}>
              <Text style={[styles.infoCardTitle, { color: colors.textPrimary }]}>
                No Icon Packs Installed
              </Text>
              <Text style={[styles.infoCardDescription, { color: colors.textSecondary }]}>
                Install Nova or Lawnchair compatible icon packs from the Play Store to customize your home screen.
              </Text>
            </View>
          </View>
        )}

        {/* ─── Display ─── */}
        <SectionHeader title="DISPLAY" colors={colors} />

        <SettingRow
          icon={<Type size={20} color={colors.textSecondary} />}
          label="App Labels"
          description="Show names below app icons"
          right={
            <Switch
              value={showLabels}
              onValueChange={setShowLabels}
              trackColor={{
                false: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                true: colors.accent,
              }}
              thumbColor="#FFFFFF"
            />
          }
          colors={colors}
          isDark={isDark}
        />

        <SettingRow
          icon={<ClockIcon size={20} color={colors.textSecondary} />}
          label="Clock Widget"
          description="Show clock on homescreen"
          right={
            <Switch
              value={showClock}
              onValueChange={setShowClock}
              trackColor={{
                false: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                true: colors.accent,
              }}
              thumbColor="#FFFFFF"
            />
          }
          colors={colors}
          isDark={isDark}
        />

        <SettingRow
          icon={<Vibrate size={20} color={colors.textSecondary} />}
          label="Haptic Feedback"
          description="Vibrate on interaction"
          right={
            <Switch
              value={hapticFeedback}
              onValueChange={setHapticFeedback}
              trackColor={{
                false: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                true: colors.accent,
              }}
              thumbColor="#FFFFFF"
            />
          }
          colors={colors}
          isDark={isDark}
        />

        {/* ─── System ─── */}
        <SectionHeader title="SYSTEM" colors={colors} />

        <SettingRow
          icon={<Home size={20} color={colors.textSecondary} />}
          label="Default Launcher"
          description="Set De-Launcher as your default home screen"
          right={
            <Pressable onPress={handleSetDefaultLauncher} style={styles.gridButton}>
              <Home size={16} color={colors.accent} />
            </Pressable>
          }
          onPress={handleSetDefaultLauncher}
          colors={colors}
          isDark={isDark}
        />

        {/* ─── About ─── */}
        <SectionHeader title="ABOUT" colors={colors} />

        <Animated.View
          entering={FadeInRight.delay(200)}
          style={[
            styles.aboutCard,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.03)",
            },
          ]}
        >
          <View style={styles.aboutHeader}>
            <Palette size={24} color={colors.accent} />
            <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>
              De-Launcher
            </Text>
          </View>
          <Text style={[styles.aboutVersion, { color: colors.textTertiary }]}>
            v1.0.0 · Intentional Minimalism
          </Text>
          <Text style={[styles.aboutBody, { color: colors.textSecondary }]}>
            A distraction-free launcher designed to help you focus on what matters.
            Only the apps you choose. Nothing more.
          </Text>
        </Animated.View>
      </ScrollView>
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
  headerTitle: {
    fontFamily: typography.family.semiBold,
    fontSize: typography.size.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["4xl"],
  },
  sectionHeader: {
    fontFamily: typography.family.semiBold,
    fontSize: typography.size.xs,
    letterSpacing: 1.5,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.md,
  },
  settingDescription: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  gridButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  gridButtonText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
  },
  aboutCard: {
    padding: spacing.xl,
    borderRadius: radii.xl,
  },
  aboutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  aboutTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xl,
  },
  aboutVersion: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    marginBottom: spacing.md,
  },
  aboutBody: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  infoCardIcon: {
    marginLeft: spacing.xs,
  },
  infoCardTextContainer: {
    flex: 1,
  },
  infoCardTitle: {
    fontFamily: typography.family.semiBold,
    fontSize: typography.size.sm,
    marginBottom: 2,
  },
  infoCardDescription: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: 16,
  },
});
