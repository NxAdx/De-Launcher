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
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeIn, FadeInRight, FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import {
  ArrowLeft,
  Grid3x3,
  Vibrate,
  Palette,
  Home,
  LayoutGrid,
  Smartphone,
  Shield,
  Sparkles,
  CheckSquare,
  Maximize2,
  Lock,
  ArrowDown,
  RotateCcw,
  EyeOff,
  Eye,
  X,
  Sun,
  Moon,
} from "lucide-react-native";
import { AppIcon } from "@/src/components/AppIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as IntentLauncher from "expo-intent-launcher";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing, ThemeAccent, ThemeMode, ACCENT_PRESETS } from "@/src/theme/tokens";
import {
  useSettingsStore,
  IconSizeOption,
} from "@/src/store/settingsStore";
import { useAppStore } from "@/src/store/appStore";
import {
  promptSetDefaultLauncher,
  getNonDistractionApps,
} from "@/src/services/appManager";
import {
  hasUsageStatsPermission,
  openUsageStatsSettings,
  isAccessibilityActive,
} from "@/modules/de-launcher-native";
import { formatDuration } from "@/src/components/ScreenTimeWidget";
import { signalNavigation } from "./_layout";

// ─── Setting Row Components ─────────────────────────────

function FocusPlusBadge({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View
      style={{
        backgroundColor: colors.accentMuted,
        borderColor: colors.accent,
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 6,
      }}
    >
      <Text
        style={{
          fontFamily: typography.family.bold,
          fontSize: 10,
          color: colors.accent,
          letterSpacing: 0.5,
        }}
      >
        Focus+
      </Text>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  badge,
  description,
  right,
  onPress,
  colors,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
              {label}
            </Text>
            {badge}
          </View>
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
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Settings store
  const theme = useSettingsStore((s) => s.theme) || "dark";
  const setTheme = useSettingsStore((s) => s.setTheme);
  const themeAccent = useSettingsStore((s) => s.themeAccent) || "sage";
  const setThemeAccent = useSettingsStore((s) => s.setThemeAccent);
  const gridColumns = useSettingsStore((s) => s.gridColumns);
  const setGridColumns = useSettingsStore((s) => s.setGridColumns);
  const hapticFeedback = useSettingsStore((s) => s.hapticFeedback);
  const setHapticFeedback = useSettingsStore((s) => s.setHapticFeedback);

  const maxDockIcons = useSettingsStore((s) => s.maxDockIcons);
  const setMaxDockIcons = useSettingsStore((s) => s.setMaxDockIcons);

  const showTodoWidget = useSettingsStore((s) => s.showTodoWidget);
  const setShowTodoWidget = useSettingsStore((s) => s.setShowTodoWidget);

  const showScreenTimeWidget = useSettingsStore((s) => s.showScreenTimeWidget);
  const setShowScreenTimeWidget = useSettingsStore((s) => s.setShowScreenTimeWidget);
  const screenTimeGoalMs = useSettingsStore((s) => s.screenTimeGoalMs);
  const setScreenTimeGoalMs = useSettingsStore((s) => s.setScreenTimeGoalMs);

  const morningPromptEnabled = useSettingsStore((s) => s.morningPromptEnabled);
  const setMorningPromptEnabled = useSettingsStore((s) => s.setMorningPromptEnabled);
  const morningPromptTime = useSettingsStore((s) => s.morningPromptTime);
  const setMorningPromptTime = useSettingsStore((s) => s.setMorningPromptTime);

  const iconSize = useSettingsStore((s) => s.iconSize);
  const setIconSize = useSettingsStore((s) => s.setIconSize);
  const iconTheme = useSettingsStore((s) => s.iconTheme) || "standard";
  const setIconTheme = useSettingsStore((s) => s.setIconTheme);

  const doubleTapToLock = useSettingsStore((s) => s.doubleTapToLock);
  const setDoubleTapToLock = useSettingsStore((s) => s.setDoubleTapToLock);
  const swipeDownAction = useSettingsStore((s) => s.swipeDownAction);
  const setSwipeDownAction = useSettingsStore((s) => s.setSwipeDownAction);

  // Focus & Distraction Shield
  const returnHomeAfterLock = useSettingsStore((s) => s.returnHomeAfterLock);
  const setReturnHomeAfterLock = useSettingsStore((s) => s.setReturnHomeAfterLock);
  const returnHomeTimeoutMinutes = useSettingsStore((s) => s.returnHomeTimeoutMinutes);
  const setReturnHomeTimeoutMinutes = useSettingsStore((s) => s.setReturnHomeTimeoutMinutes);

  const [accessibilityActive, setAccessibilityActive] = useState<boolean | null>(null);

  React.useEffect(() => {
    isAccessibilityActive()
      .then(setAccessibilityActive)
      .catch(() => setAccessibilityActive(false));
  }, []);

  // App store
  const autoArrangeHome = useAppStore((s) => s.autoArrangeHome);
  const allowedPackages = useAppStore((s) => s.allowedPackages) || [];
  const rawHiddenPackages = useAppStore((s) => s.hiddenPackages);
  const hiddenPackages = React.useMemo(() => rawHiddenPackages || [], [rawHiddenPackages]);
  const unhideApp = useAppStore((s) => s.unhideApp);
  const installedApps = useAppStore((s) => s.installedApps) || [];

  const [showHiddenAppsModal, setShowHiddenAppsModal] = useState(false);
  const [autoArrangeMessage, setAutoArrangeMessage] = useState<string | null>(null);

  const handleToggleHaptics = useCallback(
    (enabled: boolean) => {
      setHapticFeedback(enabled);
      if (enabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [setHapticFeedback]
  );

  const handleToggleScreenTime = useCallback(
    async (val: boolean) => {
      if (hapticFeedback) Haptics.selectionAsync();
      if (val) {
        try {
          const permitted = await hasUsageStatsPermission();
          if (!permitted) {
            await openUsageStatsSettings();
          }
        } catch {
          // fallback
        }
      }
      setShowScreenTimeWidget(val);
    },
    [hapticFeedback, setShowScreenTimeWidget]
  );

  const handleSetDefault = async () => {
    if (hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signalNavigation(3000);
    try {
      await promptSetDefaultLauncher();
    } catch (e) {
      console.warn("Could not prompt default launcher", e);
    }
  };

  const handleOpenAndroidSettings = () => {
    if (hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signalNavigation(3000);
    try {
      IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.SETTINGS);
    } catch (e) {
      console.warn("Could not open Android Settings", e);
    }
  };

  const handleOpenAccessibility = () => {
    if (hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signalNavigation(3000);
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
    const allApps = useAppStore.getState().installedApps;
    const nonDistractions = getNonDistractionApps(allApps);
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
        <SectionHeader title="Appearance & Icons" colors={colors} />
        <View style={styles.sectionGroup}>
          <SettingRow
            icon={isDark ? <Moon size={20} color={colors.accent} /> : <Sun size={20} color={colors.accent} />}
            label="Theme Mode"
            description={isDark ? "Dark OLED Minimalism" : "Clean Light Paper"}
            colors={colors}
            isDark={isDark}
            right={
              <View style={styles.segmentContainer}>
                {(["dark", "light"] as ThemeMode[]).map((modeOpt) => {
                  const isSelected = theme === modeOpt;
                  return (
                    <Pressable
                      key={modeOpt}
                      onPress={() => {
                        if (hapticFeedback) Haptics.selectionAsync();
                        setTheme(modeOpt);
                      }}
                      style={[
                        styles.segmentBtn,
                        isSelected && { backgroundColor: colors.accent },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          { color: isSelected ? colors.accentText : colors.textSecondary },
                        ]}
                      >
                        {modeOpt === "dark" ? "Dark" : "Light"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            }
          />

          <SettingRow
            icon={<Palette size={20} color={colors.accent} />}
            label="Theme Accent"
            description={`Palette: ${ACCENT_PRESETS[themeAccent]?.name || "Sage Oasis"}`}
            colors={colors}
            isDark={isDark}
            right={
              <View style={styles.accentSwatchesRow}>
                {(Object.keys(ACCENT_PRESETS) as ThemeAccent[]).map((key) => {
                  const preset = ACCENT_PRESETS[key];
                  const isSelected = themeAccent === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => {
                        if (hapticFeedback) Haptics.selectionAsync();
                        setThemeAccent(key);
                      }}
                      style={[
                        styles.accentSwatchBtn,
                        {
                          borderColor: isSelected ? colors.textPrimary : "rgba(255,255,255,0.12)",
                          backgroundColor: preset.previewColor,
                        },
                      ]}
                      hitSlop={8}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.accentSwatchInnerDot,
                            {
                              backgroundColor: key === "monochrome" ? "#000000" : "#FFFFFF",
                            },
                          ]}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            }
          />

          <SettingRow
            icon={<Palette size={20} color={colors.textSecondary} />}
            label="Icon Style"
            description={iconTheme === "monochrome" ? "Dopamine-Free Monochrome" : "Standard Original Colors"}
            colors={colors}
            isDark={isDark}
            right={
              <View style={styles.segmentContainer}>
                {(["standard", "monochrome"] as const).map((themeOpt) => (
                  <Pressable
                    key={themeOpt}
                    onPress={() => {
                      if (hapticFeedback) Haptics.selectionAsync();
                      setIconTheme(themeOpt);
                    }}
                    style={[
                      styles.segmentBtn,
                      iconTheme === themeOpt && { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: iconTheme === themeOpt ? colors.accentText : colors.textSecondary },
                      ]}
                    >
                      {themeOpt === "standard" ? "Standard" : "Monochrome"}
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
                        { color: iconSize === opt ? colors.accentText : colors.textSecondary },
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
                        { color: gridColumns === cols ? colors.accentText : colors.textSecondary },
                      ]}
                    >
                      {cols}
                    </Text>
                  </Pressable>
                ))}
              </View>
            }
          />
        </View>

        {/* ─── Dock Customization ──────────────────────── */}
        <SectionHeader title="Dock Settings" colors={colors} />
        <View style={styles.sectionGroup}>
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
                        { color: maxDockIcons === num ? colors.accentText : colors.textSecondary },
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
                trackColor={{ false: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)", true: colors.accent }}
                thumbColor={showTodoWidget ? (themeAccent === "monochrome" && isDark ? "#000000" : "#FFFFFF") : "#FFFFFF"}
              />
            }
          />

          <SettingRow
            icon={<Smartphone size={20} color={colors.textSecondary} />}
            label="Screen Time Tracker"
            description="Track mindful screen time, unlocks & streaks"
            colors={colors}
            isDark={isDark}
            right={
              <Switch
                value={showScreenTimeWidget}
                onValueChange={handleToggleScreenTime}
                trackColor={{ false: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)", true: colors.accent }}
                thumbColor={showScreenTimeWidget ? (themeAccent === "monochrome" && isDark ? "#000000" : "#FFFFFF") : "#FFFFFF"}
              />
            }
          />

          {showScreenTimeWidget && (
            <SettingRow
              icon={<Smartphone size={20} color={colors.accent} />}
              label="Daily Screen Goal"
              description={`Limit: ${formatDuration(screenTimeGoalMs)}`}
              colors={colors}
              isDark={isDark}
              right={
                <View style={styles.segmentContainer}>
                  {[
                    { label: "1h", ms: 1 * 60 * 60 * 1000 },
                    { label: "2h", ms: 2 * 60 * 60 * 1000 },
                    { label: "3h", ms: 3 * 60 * 60 * 1000 },
                    { label: "4h", ms: 4 * 60 * 60 * 1000 },
                  ].map((goal) => (
                    <Pressable
                      key={goal.label}
                      onPress={() => {
                        if (hapticFeedback) Haptics.selectionAsync();
                        setScreenTimeGoalMs(goal.ms);
                      }}
                      style={[
                        styles.segmentBtn,
                        screenTimeGoalMs === goal.ms && { backgroundColor: colors.accent },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          {
                            color:
                              screenTimeGoalMs === goal.ms ? colors.accentText : colors.textSecondary,
                          },
                        ]}
                      >
                        {goal.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              }
            />
          )}

          <SettingRow
            icon={<Sparkles size={20} color={colors.textSecondary} />}
            label="Morning Focus Prompt"
            description="Pre-commitment intention sheet upon waking"
            colors={colors}
            isDark={isDark}
            right={
              <Switch
                value={morningPromptEnabled}
                onValueChange={(val) => {
                  if (hapticFeedback) Haptics.selectionAsync();
                  setMorningPromptEnabled(val);
                }}
                trackColor={{ false: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)", true: colors.accent }}
                thumbColor={morningPromptEnabled ? (themeAccent === "monochrome" && isDark ? "#000000" : "#FFFFFF") : "#FFFFFF"}
              />
            }
          />

          {morningPromptEnabled && (
            <SettingRow
              icon={<Sparkles size={20} color={colors.accent} />}
              label="Prompt Time"
              description={`Triggers on first unlock at or after ${morningPromptTime}`}
              colors={colors}
              isDark={isDark}
              right={
                <View style={styles.segmentContainer}>
                  {[
                    { label: "6 AM", time: "06:00" },
                    { label: "7 AM", time: "07:00" },
                    { label: "8 AM", time: "08:00" },
                    { label: "9 AM", time: "09:00" },
                  ].map((preset) => (
                    <Pressable
                      key={preset.label}
                      onPress={() => {
                        if (hapticFeedback) Haptics.selectionAsync();
                        setMorningPromptTime(preset.time);
                      }}
                      style={[
                        styles.segmentBtn,
                        morningPromptTime === preset.time && { backgroundColor: colors.accent },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          {
                            color:
                              morningPromptTime === preset.time
                                ? colors.accentText
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              }
            />
          )}

          <SettingRow
            icon={<Sparkles size={20} color={colors.accent} />}
            label="Auto-Arrange Non-Distractions"
            description="Fill home with essential productive apps only"
            colors={colors}
            isDark={isDark}
            onPress={handleAutoArrange}
            right={<Text style={[styles.linkText, { color: colors.accent }]}>Run →</Text>}
          />
          <SettingRow
            icon={<Sparkles size={20} color={colors.accent} />}
            label="Home Apps & Intentions"
            description={`${allowedPackages.length} curated apps on Home. Tap to manage & pin.`}
            colors={colors}
            isDark={isDark}
            onPress={() => {
              signalNavigation();
              router.push("/drawer" as any);
            }}
            right={<Text style={[styles.linkText, { color: colors.accent }]}>Manage →</Text>}
          />
          {autoArrangeMessage && (
            <Animated.View entering={FadeInRight} style={styles.toastBanner}>
              <Text style={[styles.toastText, { color: colors.accent }]}>
                {autoArrangeMessage}
              </Text>
            </Animated.View>
          )}
        </View>

        {/* ─── Gestures & Interaction ───────────────── */}
        <SectionHeader title="Gestures & Interaction" colors={colors} />
        <View style={styles.sectionGroup}>
          <SettingRow
            icon={<Lock size={20} color={colors.textSecondary} />}
            label="Double-Tap to Lock"
            description="Double-tap empty space to immediately turn off screen"
            colors={colors}
            isDark={isDark}
            right={
              <Switch
                value={doubleTapToLock}
                onValueChange={(val) => {
                  if (hapticFeedback) Haptics.selectionAsync();
                  setDoubleTapToLock(val);
                }}
                trackColor={{ false: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)", true: colors.accent }}
                thumbColor={doubleTapToLock ? (themeAccent === "monochrome" && isDark ? "#000000" : "#FFFFFF") : "#FFFFFF"}
              />
            }
          />

          <SettingRow
            icon={<ArrowDown size={20} color={colors.textSecondary} />}
            label="Swipe Down Action"
            description="Choose action when swiping down on home"
            colors={colors}
            isDark={isDark}
            right={
              <View style={styles.segmentContainer}>
                {(
                  [
                    { label: "Search", action: "search" },
                    { label: "Notifications", action: "notifications" },
                  ] as const
                ).map((opt) => (
                  <Pressable
                    key={opt.action}
                    onPress={() => {
                      if (hapticFeedback) Haptics.selectionAsync();
                      setSwipeDownAction(opt.action);
                    }}
                    style={[
                      styles.segmentBtn,
                      swipeDownAction === opt.action && { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        {
                          color:
                            swipeDownAction === opt.action
                              ? colors.accentText
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            }
          />
        </View>

        {/* ─── Focus & Distraction Shield [Focus+] ─── */}
        <SectionHeader title="Focus & Distraction Shield" colors={colors} />
        <View style={styles.sectionGroup}>
          <SettingRow
            icon={<RotateCcw size={20} color={colors.accent} />}
            label="Return to Home on Lock"
            badge={<FocusPlusBadge colors={colors} />}
            description="Automatically redirects back to Home after screen lock timeout"
            colors={colors}
            isDark={isDark}
            right={
              <Switch
                value={returnHomeAfterLock}
                onValueChange={(val) => {
                  if (hapticFeedback) Haptics.selectionAsync();
                  setReturnHomeAfterLock(val);
                }}
                trackColor={{ false: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)", true: colors.accent }}
                thumbColor={returnHomeAfterLock ? (themeAccent === "monochrome" && isDark ? "#000000" : "#FFFFFF") : "#FFFFFF"}
              />
            }
          />

          {returnHomeAfterLock && (
            <SettingRow
              icon={<RotateCcw size={20} color={colors.accent} />}
              label="Lock Return Timeout"
              description="Minutes phone must stay locked before returning home"
              colors={colors}
              isDark={isDark}
              right={
                <View style={styles.segmentContainer}>
                  {[
                    { label: "0m", minutes: 0 },
                    { label: "2m", minutes: 2 },
                    { label: "5m", minutes: 5 },
                    { label: "10m", minutes: 10 },
                  ].map((preset) => (
                    <Pressable
                      key={preset.minutes}
                      onPress={() => {
                        if (hapticFeedback) Haptics.selectionAsync();
                        setReturnHomeTimeoutMinutes(preset.minutes);
                      }}
                      style={[
                        styles.segmentBtn,
                        returnHomeTimeoutMinutes === preset.minutes && { backgroundColor: colors.accent },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          {
                            color:
                              returnHomeTimeoutMinutes === preset.minutes
                                ? colors.accentText
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              }
            />
          )}

          <SettingRow
            icon={<EyeOff size={20} color={colors.accent} />}
            label="Hidden Apps"
            badge={<FocusPlusBadge colors={colors} />}
            description={
              hiddenPackages.length === 0
                ? "No apps hidden from drawer browsing"
                : `${hiddenPackages.length} app${hiddenPackages.length !== 1 ? "s" : ""} hidden from drawer browsing`
            }
            colors={colors}
            isDark={isDark}
            onPress={() => setShowHiddenAppsModal(true)}
            right={
              <Text style={[styles.linkText, { color: colors.accent }]}>
                {hiddenPackages.length > 0 ? "Manage →" : "View"}
              </Text>
            }
          />
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
            description="Powers screen lock, notifications, and focus shielding"
            colors={colors}
            isDark={isDark}
            onPress={handleOpenAccessibility}
            right={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {accessibilityActive !== null && (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: accessibilityActive
                          ? "rgba(34, 197, 94, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: accessibilityActive ? "#22C55E" : "#EF4444",
                        },
                      ]}
                    >
                      {accessibilityActive ? "Active" : "Disabled"}
                    </Text>
                  </View>
                )}
                <Text style={[styles.linkText, { color: colors.accent }]}>Open →</Text>
              </View>
            }
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
                trackColor={{ false: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)", true: colors.accent }}
                thumbColor={hapticFeedback ? (themeAccent === "monochrome" && isDark ? "#000000" : "#FFFFFF") : "#FFFFFF"}
              />
            }
          />
        </View>

        {/* ─── Brand Footer ──────────────────────────── */}
        <View style={styles.brandFooter}>
          <Image
            source={require("@/assets/adaptive-icon.png")}
            style={styles.brandFooterLogo}
            resizeMode="contain"
          />
          <Text style={[styles.brandFooterTitle, { color: colors.textPrimary }]}>
            De-Launcher
          </Text>
          <Text style={[styles.brandFooterSubtitle, { color: colors.textTertiary }]}>
            Focus. Simplified. · v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Hidden Apps Modal */}
      <Modal
        visible={showHiddenAppsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHiddenAppsModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "android" ? undefined : "padding"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.backdrop}
            onPress={() => setShowHiddenAppsModal(false)}
          />
          <Animated.View
            entering={FadeInDown.duration(200)}
            style={[
              styles.hiddenModalContainer,
              {
                backgroundColor: isDark ? "#121212" : "#FFFFFF",
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Hidden Apps
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Apps hidden from All Apps drawer browsing
                </Text>
              </View>
              <Pressable
                onPress={() => setShowHiddenAppsModal(false)}
                hitSlop={12}
                style={styles.closeBtn}
              >
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {hiddenPackages.length === 0 ? (
              <View style={styles.emptyHiddenState}>
                <EyeOff size={40} color={colors.textTertiary} />
                <Text style={[styles.emptyHiddenTitle, { color: colors.textPrimary }]}>
                  No Hidden Apps
                </Text>
                <Text style={[styles.emptyHiddenText, { color: colors.textSecondary }]}>
                  To hide an app, open All Apps, long-press any app icon, and choose &ldquo;Hide App from Drawer&rdquo;.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ maxHeight: 380 }}
                showsVerticalScrollIndicator={false}
              >
                {hiddenPackages.map((pkg) => {
                  const app = installedApps.find((a) => a.packageName === pkg);
                  const label = app ? app.label : pkg;
                  return (
                    <View
                      key={pkg}
                      style={[
                        styles.hiddenAppRow,
                        {
                          borderBottomColor: colors.border,
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.03)"
                            : "rgba(0,0,0,0.02)",
                        },
                      ]}
                    >
                      <View style={styles.hiddenAppInfo}>
                        {app && (
                          <AppIcon
                            app={app}
                            size={36}
                            showLabel={false}
                          />
                        )}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.hiddenAppLabel, { color: colors.textPrimary }]}
                            numberOfLines={1}
                          >
                            {label}
                          </Text>
                          <Text
                            style={[styles.hiddenAppSub, { color: colors.textTertiary }]}
                            numberOfLines={1}
                          >
                            {pkg}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        style={[
                          styles.unhideBtn,
                          { backgroundColor: colors.accent },
                        ]}
                        onPress={() => {
                          if (hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          unhideApp(pkg);
                        }}
                      >
                        <Eye size={14} color={colors.accentText} />
                        <Text style={[styles.unhideBtnText, { color: colors.accentText }]}>Unhide</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <Pressable
              style={[
                styles.modalDoneBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)",
                },
              ]}
              onPress={() => setShowHiddenAppsModal(false)}
            >
              <Text style={[styles.modalDoneBtnText, { color: colors.textPrimary }]}>
                Done
              </Text>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
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
  brandFooter: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.lg,
  },
  brandFooterLogo: {
    width: 48,
    height: 48,
    marginBottom: spacing.xs,
  },
  brandFooterTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    letterSpacing: 0.5,
  },
  brandFooterSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  hiddenModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing["2xl"],
    borderWidth: 1,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
  },
  modalSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
    borderRadius: 8,
  },
  emptyHiddenState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["3xl"],
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyHiddenTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    marginTop: spacing.xs,
  },
  emptyHiddenText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  hiddenAppRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hiddenAppInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  hiddenAppLabel: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
  },
  hiddenAppSub: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    marginTop: 1,
  },
  unhideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 8,
  },
  unhideBtnText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: "#FFFFFF",
  },
  modalDoneBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: "center",
  },
  modalDoneBtnText: {
    fontFamily: typography.family.semiBold,
    fontSize: typography.size.base,
  },
  accentSwatchesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  accentSwatchBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  accentSwatchInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
