/**
 * ScreenTimeModal Component — De-Launcher
 *
 * Full interactive bottom sheet / modal for Digital Wellbeing & Screen Time.
 * Incorporates usage statistics patterns from Olauncher and card layout from Kvaesitso.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
import * as Haptics from "expo-haptics";
import {
  X,
  Smartphone,
  Flame,
  Clock,
  ExternalLink,
  Sun,
  ShieldCheck,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/ThemeContext";
import { spacing, palette } from "@/src/theme/tokens";
import { useSettingsStore } from "@/src/store/settingsStore";
import { useWellbeingStore } from "@/src/store/wellbeingStore";
import { useAppStore } from "@/src/store/appStore";
import { getTopAppUsage, openDigitalWellbeing, AppUsageItem } from "@/modules/de-launcher-native";
import { formatDuration } from "./ScreenTimeWidget";

interface ScreenTimeModalProps {
  visible: boolean;
  screenTimeMs: number;
  unlockCount: number;
  onClose: () => void;
}

export function ScreenTimeModal({
  visible,
  screenTimeMs,
  unlockCount,
  onClose,
}: ScreenTimeModalProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);
  const goalMs = useSettingsStore((s) => s.screenTimeGoalMs);

  const streak = useWellbeingStore((s) => s.currentScreenStreak);
  const bestStreak = useWellbeingStore((s) => s.bestScreenStreak);
  const installedApps = useAppStore((s) => s.installedApps);

  const [topApps, setTopApps] = useState<AppUsageItem[]>([]);

  useEffect(() => {
    if (!visible) return;
    getTopAppUsage(5).then((apps: AppUsageItem[]) => {
      setTopApps(apps);
    }).catch(() => {});
  }, [visible]);

  const handleClose = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleOpenWellbeing = async () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await openDigitalWellbeing();
  };

  const handleOpenSettings = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push("/settings");
  };

  // Free hours calculation: 24h - screenTime - 8h (est sleep)
  const dayMs = 24 * 60 * 60 * 1000;
  const sleepMs = 8 * 60 * 60 * 1000;
  const freeTimeMs = Math.max(0, dayMs - sleepMs - screenTimeMs);

  const progress = goalMs > 0 ? Math.min(1, screenTimeMs / goalMs) : 0;
  const progressPercent = Math.round((screenTimeMs / (goalMs || 1)) * 100);

  const getProgressColor = () => {
    if (progressPercent >= 100) return palette.error;
    if (progressPercent >= 80) return palette.warning;
    return colors.accent;
  };

  const maxAppTime = topApps.length > 0 ? topApps[0].timeMs : 1;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
          accessibilityLabel="Dismiss screen time modal"
        />

        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: isDark ? "#121212" : "#FFFFFF",
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.titleWithIcon}>
                <Smartphone size={18} color={colors.accent} strokeWidth={2.2} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  DIGITAL WELLBEING
                </Text>
              </View>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Mindful phone usage & daily awareness
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={12}
            >
              <X size={18} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Primary Awareness Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.cardHeaderSmall, { color: colors.textSecondary }]}>
                {"TODAY'S SCREEN TIME"}
              </Text>
              <Text style={[styles.primaryBigTime, { color: colors.textPrimary }]}>
                {formatDuration(screenTimeMs)}
              </Text>

              <View style={styles.statBadgesRow}>
                <View
                  style={[
                    styles.statBadge,
                    {
                      backgroundColor: isDark ? "#1E1E1E" : "#F1F5F9",
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Sun size={14} color={colors.accent} />
                  <View>
                    <Text style={[styles.statBadgeValue, { color: colors.textPrimary }]}>
                      {formatDuration(freeTimeMs)}
                    </Text>
                    <Text style={[styles.statBadgeLabel, { color: colors.textSecondary }]}>
                      Offline / Free
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statBadge,
                    {
                      backgroundColor: isDark ? "#1E1E1E" : "#F1F5F9",
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Clock size={14} color={colors.accentTint} />
                  <View>
                    <Text style={[styles.statBadgeValue, { color: colors.textPrimary }]}>
                      {unlockCount}
                    </Text>
                    <Text style={[styles.statBadgeLabel, { color: colors.textSecondary }]}>
                      Device Unlocks
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Daily Goal & Streak Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.goalTopRow}>
                <View style={styles.streakBadgeWrapper}>
                  <Flame size={16} color={palette.warning} />
                  <Text style={[styles.streakTitle, { color: colors.textPrimary }]}>
                    {streak} Day Streak
                  </Text>
                  {bestStreak > 0 && (
                    <Text style={[styles.bestStreakText, { color: colors.textSecondary }]}>
                      (Best: {bestStreak}d)
                    </Text>
                  )}
                </View>
                <Text style={[styles.goalTargetText, { color: colors.accentTint }]}>
                  Goal: {formatDuration(goalMs)}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={[styles.largeProgressBg, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.largeProgressFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: getProgressColor(),
                    },
                  ]}
                />
              </View>

              <View style={styles.goalStatusRow}>
                <Text style={[styles.goalPercentText, { color: getProgressColor() }]}>
                  {progressPercent}% used
                </Text>
                <Text style={[styles.goalRemainingText, { color: colors.textSecondary }]}>
                  {screenTimeMs < goalMs
                    ? `${formatDuration(goalMs - screenTimeMs)} remaining`
                    : "Daily limit exceeded"}
                </Text>
              </View>

              <Text style={[styles.goalTip, { color: colors.textSecondary }]}>
                {screenTimeMs <= goalMs
                  ? "Keep screen time under your daily goal before midnight to extend your streak!"
                  : "Streak resets at midnight if screen time exceeds your goal. Consider unplugging."}
              </Text>
            </View>

            {/* Top Apps Today */}
            {topApps.length > 0 && (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.cardHeaderSmall, { color: colors.textSecondary }]}>
                  TOP APPS TODAY
                </Text>

                <View style={styles.appListContainer}>
                  {topApps.map((item) => {
                    const matchedApp = installedApps.find(
                      (a) => a.packageName === item.packageName
                    );
                    const appIconUri = matchedApp?.icon;
                    const relativeWidth =
                      maxAppTime > 0
                        ? Math.max(0.05, Math.min(1, item.timeMs / maxAppTime))
                        : 0;

                    return (
                      <View key={item.packageName} style={styles.appRow}>
                        <View style={styles.appIconWrapper}>
                          {appIconUri ? (
                            <Image
                              source={{ uri: appIconUri }}
                              style={styles.appIcon}
                            />
                          ) : (
                            <View
                              style={[
                                styles.appFallbackIcon,
                                { backgroundColor: colors.accentMuted },
                              ]}
                            >
                              <Text style={[styles.appFallbackText, { color: colors.accent }]}>
                                {item.label.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.appDetailsCol}>
                          <View style={styles.appLabelRow}>
                            <Text
                              numberOfLines={1}
                              style={[styles.appLabel, { color: colors.textPrimary }]}
                            >
                              {item.label}
                            </Text>
                            <Text style={[styles.appTime, { color: colors.accentTint }]}>
                              {formatDuration(item.timeMs)}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.appBarBg,
                              { backgroundColor: colors.border },
                            ]}
                          >
                            <View
                              style={[
                                styles.appBarFill,
                                {
                                  width: `${relativeWidth * 100}%`,
                                  backgroundColor: colors.accent,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <Pressable
                onPress={handleOpenWellbeing}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: colors.accentMuted,
                    borderColor: colors.accent,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <ShieldCheck size={16} color={colors.accentTint} />
                <Text style={[styles.actionButtonText, { color: colors.accentTint }]}>
                  System Digital Wellbeing
                </Text>
                <ExternalLink size={14} color={colors.accentTint} />
              </Pressable>

              <Pressable
                onPress={handleOpenSettings}
                style={({ pressed }) => [
                  styles.ghostButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.ghostButtonText, { color: colors.textSecondary }]}>
                  Change Daily Goal & Settings
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    maxHeight: "88%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleGroup: {
    flex: 1,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.md,
  },
  scrollBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing["2xl"],
    gap: spacing.md,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md + 2,
  },
  cardHeaderSmall: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  primaryBigTime: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  statBadgesRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  statBadgeValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  statBadgeLabel: {
    fontSize: 11,
    marginTop: 1,
  },
  goalTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  streakBadgeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  bestStreakText: {
    fontSize: 12,
  },
  goalTargetText: {
    fontSize: 13,
    fontWeight: "600",
  },
  largeProgressBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: spacing.xs,
  },
  largeProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  goalStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  goalPercentText: {
    fontSize: 12,
    fontWeight: "700",
  },
  goalRemainingText: {
    fontSize: 12,
  },
  goalTip: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
  appListContainer: {
    marginTop: spacing.sm,
    gap: spacing.sm + 2,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  appIconWrapper: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  appFallbackIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  appFallbackText: {
    fontSize: 14,
    fontWeight: "700",
  },
  appDetailsCol: {
    flex: 1,
  },
  appLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  appLabel: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  appTime: {
    fontSize: 12,
    fontWeight: "600",
  },
  appBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  appBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  actionsContainer: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  ghostButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  ghostButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
