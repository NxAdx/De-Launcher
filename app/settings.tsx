/**
 * Settings Screen — De-Launcher
 *
 * Comprehensive launcher configuration:
 * - Appearance & Theme (Dark/Light)
 * - Home Layout & Icon Sizing (Small, Medium, Large)
 * - Search Widget Customization (Pill, Rounded, Minimal)
 * - Dock Customization (Frosted Glass vs Transparent, 4-6 icons)
 * - Daily Focus & Streak Widget
 * - Auto-arrange Home with non-distracting apps
 * - Icon Packs & Wallpaper
 * - System Permissions & Default Home
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
  Search,
  Sparkles,
  Layers,
  CheckSquare,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as IntentLauncher from "expo-intent-launcher";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import {
  useSettingsStore,
  SearchWidgetStyle,
  DockBackgroundStyle,
  IconSizeOption,
} from "@/src/store/settingsStore";
import { useAppStore } from "@/src/store/appStore";
import {
  getAvailableIconPacks,
  getCachedIconPacks,
  promptSetDefaultLauncher,
  changeWallpaper,
  getNonDistractionApps,
} from "@/src/services/appManager";
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
  right?: React.ReactNode;
  onPress?: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
}) {
  const content = (
    <>
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
    </>
  );

  const rowStyle = [
    styles.settingRow,
    {
      backgroundColor: isDark
        ? "rgba(255,255,255,0.03)"
        : "rgba(0,0,0,0.03)",
    },
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={rowStyle}>
        {content}
      </Pressable>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

function SectionHeader({
  title,
  colors,
}: {
  title: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>
      {title}
    </Text>
  );
}

// ─── Main Settings Screen ───────────────────────────────

export default function SettingsScreen() {
  const { colors, isDark, mode, setTheme } = useTheme();
  const insets = useSafeAreaInsets();

  // Settings store
  const gridColumns = useSettingsStore((s) => s.gridColumns);
  const setGridColumns = useSettingsStore((s) => s.setGridColumns);
  const showLabels = useSettingsStore((s) => s.showLabels);
  const setShowLabels = useSettingsStore((s) => s.setShowLabels);
  const showClock = useSettingsStore((s) => s.showClock);
  const setShowClock = useSettingsStore((s) => s.setShowClock);
  const hapticFeedback = useSettingsStore((s) => s.hapticFeedback);
  const setHapticFeedback = useSettingsStore((s) => s.setHapticFeedback);
  const activeIconPack = useSettingsStore((s) => s.activeIconPack);
  const setActiveIconPack = useSettingsStore((s) => s.setActiveIconPack);

  const showHomeSearchWidget = useSettingsStore((s) => s.showHomeSearchWidget);
  const setShowHomeSearchWidget = useSettingsStore((s) => s.setShowHomeSearchWidget);
  const searchWidgetStyle = useSettingsStore((s) => s.searchWidgetStyle);
  const setSearchWidgetStyle = useSettingsStore((s) => s.setSearchWidgetStyle);

  const dockBackground = useSettingsStore((s) => s.dockBackground);
  const setDockBackground = useSettingsStore((s) => s.setDockBackground);
  const maxDockIcons = useSettingsStore((s) => s.maxDockIcons);
  const setMaxDockIcons = useSettingsStore((s) => s.setMaxDockIcons);

  const showTodoWidget = useSettingsStore((s) => s.showTodoWidget);
  const setShowTodoWidget = useSettingsStore((s) => s.setShowTodoWidget);

  const iconSize = useSettingsStore((s) => s.iconSize);
  const setIconSize = useSettingsStore((s) => s.setIconSize);

  // App store
  const installedApps = useAppStore((s) => s.installedApps);
  const autoArrangeHome = useAppStore((s) => s.autoArrangeHome);

  // Icon packs
  const [iconPacks, setIconPacks] = useState<IconPackInfo[]>(
    () => getCachedIconPacks() || []
  );
  const [loadingIconPacks, setLoadingIconPacks] = useState(
    () => !getCachedIconPacks()
  );
  const [showIconPackDropdown, setShowIconPackDropdown] = useState(false);
  const [autoArrangeMessage, setAutoArrangeMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getAvailableIconPacks()
      .then((packs) => {
        if (isMounted) {
          setIconPacks(packs);
          setLoadingIconPacks(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingIconPacks(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleHaptics = useCallback(
    (enabled: boolean) => {
      setHapticFeedback(enabled);
      if (enabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [setHapticFeedback]
  );

  const handleSetDefault = async () => {
    if (hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await promptSetDefaultLauncher();
  };

  const handleChangeWallpaper = async () => {
    if (hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await changeWallpaper();
  };

  const handleOpenAndroidSettings = () => {
    if (hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.SETTINGS);
    } catch (e) {
      console.warn("Could not open Android Settings", e);
    }
  };

  const handleOpenAccessibility = () => {
    if (hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.ACCESSIBILITY_SETTINGS
      );
    } catch (e) {
      console.warn("Could not open Accessibility Settings", e);
    }
  };

  const handleAutoArrange = () => {
    if (hapticFeedback) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const nonDistractions = getNonDistractionApps(installedApps);
    const pkgList = nonDistractions.map((a) => a.packageName);
    autoArrangeHome(pkgList);
    setAutoArrangeMessage(`Added ${pkgList.length} non-distracting apps to Home.`);
    setTimeout(() => setAutoArrangeMessage(null), 4000);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, paddingTop: insets.top },
      ]}
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
          Launcher Settings
        </Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing["3xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Appearance ───────────────────────────── */}
        <SectionHeader title="Appearance & Themes" colors={colors} />
        <View style={styles.sectionGroup}>
          <SettingRow
            icon={<Palette size={20} color={colors.textSecondary} />}
            label="Theme"
            description={mode === "dark" ? "Dark Mode (OLED black)" : "Light Mode (Clean & bright)"}
            colors={colors}
            isDark={isDark}
            right={
              <View style={styles.segmentContainer}>
                {(["dark", "light"] as const).map((tOpt) => (
                  <Pressable
                    key={tOpt}
                    onPress={() => {
                      if (hapticFeedback) Haptics.selectionAsync();
                      setTheme(tOpt);
                    }}
                    style={[
                      styles.segmentBtn,
                      mode === tOpt && { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: mode === tOpt ? "#FFFFFF" : colors.textSecondary },
                      ]}
                    >
                      {tOpt === "dark" ? "Dark" : "Light"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            }
          />

          <SettingRow
            icon={<Maximize2 size={20} color={colors.textSecondary} />}
            label="Icon Sizing"
            description={`Current: ${iconSize.charAt(0).toUpperCase() + iconSize.slice(1)}`}
            colors={colors}
            isDark={isDark}
            right={
              <View style={styles.segmentContainer}>
                {(["small", "medium", "large"] as IconSizeOption[]).map((opt) => (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      if (hapticFeedback) Haptics.selectionAsync();
                      setIconSize(opt);
                    }}
                    style={[
                      styles.segmentBtn,
                      iconSize === opt && { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: iconSize === opt ? "#FFFFFF" : colors.textSecondary },
                      ]}
                    >
                      {opt.charAt(0).toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            }
          />

          <SettingRow
            icon={<Grid3x3 size={20} color={colors.textSecondary} />}
            label="Grid Columns"
            description={`${gridColumns} columns per page`}
            colors={colors}
            isDark={isDark}
            right={
              <View style={styles.segmentContainer}>
                {[3, 4, 5].map((cols) => (
                  <Pressable
                    key={cols}
                    onPress={() => {
                      if (hapticFeedback) Haptics.selectionAsync();
                      setGridColumns(cols);
                    }}
                    style={[
                      styles.segmentBtn,
                      gridColumns === cols && { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: gridColumns === cols ? "#FFFFFF" : colors.textSecondary },
                      ]}
                    >
                      {cols}
                    </Text>
                  </Pressable>
                ))}
              </View>
            }
          />

          <SettingRow
            icon={<Type size={20} color={colors.textSecondary} />}
            label="App Labels"
            description="Show app names below icons"
            colors={colors}
            isDark={isDark}
            right={
              <Switch
                value={showLabels}
                onValueChange={(val) => {
                  if (hapticFeedback) Haptics.selectionAsync();
                  setShowLabels(val);
                }}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <SettingRow
            icon={<ClockIcon size={20} color={colors.textSecondary} />}
            label="Clock Widget"
            description="Show digital time on home"
            colors={colors}
            isDark={isDark}
            right={
              <Switch
                value={showClock}
                onValueChange={(val) => {
                  if (hapticFeedback) Haptics.selectionAsync();
                  setShowClock(val);
                }}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        {/* ─── Search Widget ───────────────────────────── */}
        <SectionHeader title="Home Search Widget" colors={colors} />
        <View style={styles.sectionGroup}>
          <SettingRow
            icon={<Search size={20} color={colors.textSecondary} />}
            label="Show Search Bar"
            description="Minimalist search bar on home screen"
            colors={colors}
            isDark={isDark}
            right={
              <Switch
                value={showHomeSearchWidget}
                onValueChange={(val) => {
                  if (hapticFeedback) Haptics.selectionAsync();
                  setShowHomeSearchWidget(val);
                }}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            }
          />

          {showHomeSearchWidget && (
            <SettingRow
              icon={<Layers size={20} color={colors.textSecondary} />}
              label="Widget Style"
              description={`Current: ${searchWidgetStyle.charAt(0).toUpperCase() + searchWidgetStyle.slice(1)}`}
              colors={colors}
              isDark={isDark}
              right={
                <View style={styles.segmentContainer}>
                  {(["pill", "rounded", "minimal"] as SearchWidgetStyle[]).map((styleOpt) => (
                    <Pressable
                      key={styleOpt}
                      onPress={() => {
                        if (hapticFeedback) Haptics.selectionAsync();
                        setSearchWidgetStyle(styleOpt);
                      }}
                      style={[
                        styles.segmentBtn,
                        searchWidgetStyle === styleOpt && { backgroundColor: colors.accent },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          { color: searchWidgetStyle === styleOpt ? "#FFFFFF" : colors.textSecondary },
                        ]}
                      >
                        {styleOpt.charAt(0).toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              }
            />
          )}
        </View>

        {/* ─── Dock Customization ──────────────────────── */}
        <SectionHeader title="Dock Settings" colors={colors} />
        <View style={styles.sectionGroup}>
          <SettingRow
            icon={<Layers size={20} color={colors.textSecondary} />}
            label="Dock Background"
            description={dockBackground === "frosted" ? "Frosted Translucent" : "Transparent Clean"}
            colors={colors}
            isDark={isDark}
            right={
              <View style={styles.segmentContainer}>
                {(["frosted", "transparent"] as DockBackgroundStyle[]).map((bgOpt) => (
                  <Pressable
                    key={bgOpt}
                    onPress={() => {
                      if (hapticFeedback) Haptics.selectionAsync();
                      setDockBackground(bgOpt);
                    }}
                    style={[
                      styles.segmentBtn,
                      dockBackground === bgOpt && { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: dockBackground === bgOpt ? "#FFFFFF" : colors.textSecondary },
                      ]}
                    >
                      {bgOpt === "frosted" ? "Frosted" : "Clear"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            }
          />

          <SettingRow
            icon={<LayoutGrid size={20} color={colors.textSecondary} />}
            label="Max Dock Icons"
            description={`Allows up to ${maxDockIcons} essential apps in the dock`}
            colors={colors}
            isDark={isDark}
            right={
              <View style={styles.segmentContainer}>
                {[4, 5, 6].map((num) => (
                  <Pressable
                    key={num}
                    onPress={() => {
                      if (hapticFeedback) Haptics.selectionAsync();
                      setMaxDockIcons(num);
                    }}
                    style={[
                      styles.segmentBtn,
                      maxDockIcons === num && { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: maxDockIcons === num ? "#FFFFFF" : colors.textSecondary },
                      ]}
                    >
                      {num}
                    </Text>
                  </Pressable>
                ))}
              </View>
            }
          />

          <SettingRow
            icon={<LayoutGrid size={20} color={colors.textSecondary} />}
            label="Configure Dock Apps"
            description="Reorder or toggle dock shortcuts"
            colors={colors}
            isDark={isDark}
            onPress={() => {
              signalNavigation();
              router.push("/dock-settings" as any);
            }}
            right={<Text style={[styles.linkText, { color: colors.accent }]}>Manage →</Text>}
          />
        </View>

        {/* ─── Productivity & Focus ────────────────────── */}
        <SectionHeader title="Productivity & Focus Tools" colors={colors} />
        <View style={styles.sectionGroup}>
          <SettingRow
            icon={<CheckSquare size={20} color={colors.textSecondary} />}
            label="Daily Focus & Streaks"
            description="Habit streak & intentional tasks on home"
            colors={colors}
            isDark={isDark}
            right={
              <Switch
                value={showTodoWidget}
                onValueChange={(val) => {
                  if (hapticFeedback) Haptics.selectionAsync();
                  setShowTodoWidget(val);
                }}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <SettingRow
            icon={<Sparkles size={20} color={colors.accent} />}
            label="Auto-Arrange Non-Distractions"
            description="Fill home with essential productive apps only"
            colors={colors}
            isDark={isDark}
            onPress={handleAutoArrange}
            right={<Text style={[styles.linkText, { color: colors.accent }]}>Run ⚡</Text>}
          />
          {autoArrangeMessage && (
            <Animated.View entering={FadeInRight} style={styles.toastBanner}>
              <Text style={[styles.toastText, { color: colors.accent }]}>
                {autoArrangeMessage}
              </Text>
            </Animated.View>
          )}
        </View>

        {/* ─── Icon Packs Dropdown ─────────────────────── */}
        <SectionHeader title="Custom Icon Packs" colors={colors} />
        <View style={styles.sectionGroup}>
          <Pressable
            onPress={() => {
              if (hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowIconPackDropdown((prev) => !prev);
            }}
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
              <Palette size={20} color={colors.textSecondary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  Icon Pack Theme
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                  {activeIconPack
                    ? (iconPacks.find((p) => p.packageName === activeIconPack)?.label || activeIconPack)
                    : "Default (System Icons)"}
                </Text>
              </View>
            </View>
            {showIconPackDropdown ? (
              <ChevronUp size={20} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={colors.textSecondary} />
            )}
          </Pressable>

          {/* Dropdown Options */}
          {showIconPackDropdown && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.dropdownContainer}>
              {/* Option 1: Default System Icons */}
              <Pressable
                onPress={() => {
                  if (hapticFeedback) Haptics.selectionAsync();
                  setActiveIconPack(null);
                  setShowIconPackDropdown(false);
                }}
                style={[
                  styles.dropdownRow,
                  activeIconPack === null && {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <View style={styles.dropdownRowLeft}>
                  <Smartphone size={18} color={activeIconPack === null ? colors.accent : colors.textSecondary} />
                  <View style={{ marginLeft: spacing.sm }}>
                    <Text style={[styles.dropdownLabel, { color: activeIconPack === null ? colors.accent : colors.textPrimary }]}>
                      Default (System Icons)
                    </Text>
                    <Text style={[styles.dropdownSublabel, { color: colors.textTertiary }]}>
                      Original app icons
                    </Text>
                  </View>
                </View>
                {activeIconPack === null && <Check size={18} color={colors.accent} />}
              </Pressable>

              {/* Detected Icon Packs */}
              {loadingIconPacks ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
                    Scanning for icon packs...
                  </Text>
                </View>
              ) : iconPacks.length === 0 ? (
                <View style={styles.dropdownEmptyRow}>
                  <Text style={[styles.dropdownEmptyText, { color: colors.textTertiary }]}>
                    No third-party icon packs detected on device. Install icon packs from Google Play / F-Droid to customize icons.
                  </Text>
                </View>
              ) : (
                iconPacks.map((pack) => {
                  const isSelected = activeIconPack === pack.packageName;
                  return (
                    <Pressable
                      key={pack.packageName}
                      onPress={() => {
                        if (hapticFeedback) Haptics.selectionAsync();
                        setActiveIconPack(isSelected ? null : pack.packageName);
                        setShowIconPackDropdown(false);
                      }}
                      style={[
                        styles.dropdownRow,
                        isSelected && {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.06)",
                        },
                      ]}
                    >
                      <View style={styles.dropdownRowLeft}>
                        <Palette size={18} color={isSelected ? colors.accent : colors.textSecondary} />
                        <View style={{ marginLeft: spacing.sm }}>
                          <Text style={[styles.dropdownLabel, { color: isSelected ? colors.accent : colors.textPrimary }]}>
                            {pack.label}
                          </Text>
                          <Text style={[styles.dropdownSublabel, { color: colors.textTertiary }]}>
                            {pack.packageName}
                          </Text>
                        </View>
                      </View>
                      {isSelected && <Check size={18} color={colors.accent} />}
                    </Pressable>
                  );
                })
              )}
            </Animated.View>
          )}
        </View>

        {/* ─── System & Device Actions ────────────────── */}
        <SectionHeader title="System & Recovery" colors={colors} />
        <View style={styles.sectionGroup}>
          <SettingRow
            icon={<Home size={20} color={colors.textSecondary} />}
            label="Set as Default Home"
            description="Open Android Default Apps settings"
            colors={colors}
            isDark={isDark}
            onPress={handleSetDefault}
            right={<Text style={[styles.linkText, { color: colors.accent }]}>Open →</Text>}
          />

          <SettingRow
            icon={<Shield size={20} color={colors.textSecondary} />}
            label="Accessibility Service"
            description="Manage background focus blocking permission"
            colors={colors}
            isDark={isDark}
            onPress={handleOpenAccessibility}
            right={<Text style={[styles.linkText, { color: colors.accent }]}>Open →</Text>}
          />

          <SettingRow
            icon={<ImageIcon size={20} color={colors.textSecondary} />}
            label="System Wallpaper"
            description="Select phone background"
            colors={colors}
            isDark={isDark}
            onPress={handleChangeWallpaper}
            right={<Text style={[styles.linkText, { color: colors.accent }]}>Change →</Text>}
          />

          <SettingRow
            icon={<Smartphone size={20} color={colors.textSecondary} />}
            label="Android Device Settings"
            description="Open system settings"
            colors={colors}
            isDark={isDark}
            onPress={handleOpenAndroidSettings}
            right={<Text style={[styles.linkText, { color: colors.accent }]}>Open →</Text>}
          />

          <SettingRow
            icon={<Vibrate size={20} color={colors.textSecondary} />}
            label="Haptic Feedback"
            description="Vibrate on gestures and presses"
            colors={colors}
            isDark={isDark}
            right={
              <Switch
                value={hapticFeedback}
                onValueChange={handleToggleHaptics}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>
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
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  sectionHeader: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  sectionGroup: {
    borderRadius: 18,
    overflow: "hidden",
    gap: 1,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    minHeight: 52,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    paddingRight: spacing.sm,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
  },
  settingDescription: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
  },
  segmentContainer: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 3,
    borderRadius: 10,
  },
  segmentBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 7,
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
  },
  linkText: {
    fontFamily: typography.family.semiBold,
    fontSize: typography.size.xs,
  },
  toastBanner: {
    padding: spacing.sm,
    backgroundColor: "rgba(148, 163, 184, 0.12)",
    borderRadius: 8,
    marginVertical: 4,
  },
  toastText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    textAlign: "center",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  loadingText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
  },
  emptyRow: {
    padding: spacing.md,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  emptyText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
  },
  dropdownContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  dropdownRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dropdownLabel: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
  },
  dropdownSublabel: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    marginTop: 2,
  },
  dropdownEmptyRow: {
    padding: spacing.md,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  dropdownEmptyText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
});
