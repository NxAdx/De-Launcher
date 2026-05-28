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
  ActivityIndicator,
} from "react-native";
import Animated, { FadeIn, FadeInRight } from "react-native-reanimated";
import { router } from "expo-router";
import {
  ArrowLeft,
  Grid3x3,
  Type,
  Clock as ClockIcon,
  Vibrate,
  Palette,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Smartphone,
  Shield,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as IntentLauncher from "expo-intent-launcher";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing, radii, palette } from "@/src/theme/tokens";
import { useSettingsStore } from "@/src/store/settingsStore";
import { getAvailableIconPacks, getCachedIconPacks, promptSetDefaultLauncher, changeWallpaper } from "@/src/services/appManager";
import { signalNavigation } from "./_layout";
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

/** Card wrapper that groups related setting rows with dividers between them */
function SectionCard({ children }: { children: React.ReactNode }) {
  const childArray = React.Children.toArray(children);
  return (
    <View style={styles.sectionCard}>
      {childArray.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < childArray.length - 1 && <View style={styles.sectionDivider} />}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [iconPacks, setIconPacks] = useState<IconPackInfo[]>(
    () => getCachedIconPacks() ?? []
  );
  const [isIconPacksLoading, setIsIconPacksLoading] = useState(
    () => getCachedIconPacks() === null
  );

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
    let isMounted = true;
    const cached = getCachedIconPacks();
    if (cached !== null) {
      setIconPacks(cached);
      setIsIconPacksLoading(false);
      return;
    }

    const loadIconPacks = async () => {
      try {
        const packs = await getAvailableIconPacks();
        if (isMounted) {
          setIconPacks(packs);
        }
      } catch (error) {
        console.error("Failed to load icon packs:", error);
      } finally {
        if (isMounted) {
          setIsIconPacksLoading(false);
        }
      }
    };
    loadIconPacks();
    return () => {
      isMounted = false;
    };
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

  const openAndroidSettings = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.SETTINGS);
    } catch (e) {
      console.warn("Failed to open Android Settings", e);
    }
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
        <Pressable onPress={() => { signalNavigation(); router.back(); }} hitSlop={16}>
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
        {/* ─── System & Recovery ─── */}
        <SectionHeader title="SYSTEM & RECOVERY" colors={colors} />
        <SectionCard>
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
          <SettingRow
            icon={<Smartphone size={20} color={colors.textSecondary} />}
            label="Android Settings"
            description="Open device settings (fallback recovery)"
            right={
              <Pressable onPress={openAndroidSettings} style={styles.gridButton}>
                <Smartphone size={16} color={colors.accent} />
              </Pressable>
            }
            onPress={openAndroidSettings}
            colors={colors}
            isDark={isDark}
          />
        </SectionCard>

        {/* ─── Home Layout ─── */}
        <SectionHeader title="HOME LAYOUT" colors={colors} />
        <SectionCard>
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
            icon={<LayoutGrid size={20} color={colors.textSecondary} />}
            label="Configure Dock"
            description="Manage and reorder your 5 dock apps"
            right={
              <Pressable onPress={() => { signalNavigation(); router.push("/dock-settings" as any); }} style={styles.gridButton}>
                <LayoutGrid size={16} color={colors.accent} />
              </Pressable>
            }
            onPress={() => { signalNavigation(); router.push("/dock-settings" as any); }}
            colors={colors}
            isDark={isDark}
          />
        </SectionCard>

        {/* ─── Focus Mode ─── */}
        <SectionHeader title="FOCUS MODE" colors={colors} />
        <SectionCard>
          <SettingRow
            icon={<Shield size={20} color={colors.textSecondary} />}
            label="Allowed Apps"
            description="Manage apps visible on your homescreen"
            right={
              <Pressable onPress={() => { signalNavigation(); router.push("/drawer"); }} style={styles.gridButton}>
                <Shield size={16} color={colors.accent} />
              </Pressable>
            }
            onPress={() => { signalNavigation(); router.push("/drawer"); }}
            colors={colors}
            isDark={isDark}
          />
        </SectionCard>

        {/* ─── Appearance ─── */}
        <SectionHeader title="APPEARANCE" colors={colors} />
        <SectionCard>
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
        </SectionCard>

        {/* ─── Icon Packs ─── */}
        <SectionHeader title="ICON PACKS" colors={colors} />
        <SectionCard>
        {isIconPacksLoading ? (
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
            <ActivityIndicator color={colors.accent} style={styles.infoCardIcon} />
            <View style={styles.infoCardTextContainer}>
              <Text style={[styles.infoCardTitle, { color: colors.textPrimary }]}>
                Finding Icon Packs
              </Text>
              <Text style={[styles.infoCardDescription, { color: colors.textSecondary }]}>
                Installed themes will appear here.
              </Text>
            </View>
          </View>
        ) : iconPacks.length > 0 ? (
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
                            ? palette.dark.surface
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
                            ? palette.textLight.secondary
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
                              ? palette.dark.surface
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
                              ? palette.textLight.secondary
                              : colors.textTertiary,
                        },
                      ]}
                    >
                      {pack.mappingCount === null
                        ? "Available - icons load when selected"
                        : `${pack.mappingCount} custom icons`}
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
        </SectionCard>

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
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: spacing.base,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: 0,
    marginBottom: 0,
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
    borderColor: "rgba(255, 255, 255, 0.08)",
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
