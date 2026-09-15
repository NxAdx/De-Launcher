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
  AlertTriangle,
  CheckCircle2,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/ThemeContext";
import { spacing, palette, typography } from "@/src/theme/tokens";
import { useSettingsStore } from "@/src/store/settingsStore";
import { useWellbeingStore } from "@/src/store/wellbeingStore";
import { useAppStore } from "@/src/store/appStore";
import {
  getTopAppUsage,
  openDigitalWellbeing,
  AppUsageItem,
  getScreenTimeHistory,
  DailyUsageHistoryItem,
} from "@/modules/de-launcher-native";
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
  const [history, setHistory] = useState<DailyUsageHistoryItem[]>([]);

  useEffect(() => {
    if (!visible) return;
    getTopAppUsage(5).then((apps: AppUsageItem[]) => {
      setTopApps(apps);
    }).catch(() => {});
    getScreenTimeHistory(7).then((hist: DailyUsageHistoryItem[]) => {
      setHistory(hist);
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
                  {goalMs > 0 && screenTimeMs > goalMs ? (
                    <>
                      <AlertTriangle size={16} color={palette.error} />
                      <Text style={[styles.streakTitle, { color: palette.error }]}>
                        Daily Limit Exceeded · Streak Broken (0d)
                      </Text>
                    </>
                  ) : streak > 0 ? (
                    <>
                      <Flame size={16} color={palette.warning} />
                      <Text style={[styles.streakTitle, { color: colors.textPrimary }]}>
                        {streak} Day Streak
                      </Text>
                      {bestStreak > 0 && (
                        <Text style={[styles.bestStreakText, { color: colors.textSecondary }]}>
                          (Best: {bestStreak}d)
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Flame size={16} color={colors.textTertiary} />
                      <Text style={[styles.streakTitle, { color: colors.textSecondary }]}>
                        0 Day Streak
                      </Text>
                    </>
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
                  : "Daily threshold exceeded. Unplug and rest your mind to begin a fresh streak tomorrow."}
              </Text>
            </View>

            {/* 7-Day Screen Time History Card */}
            {history.length > 0 && (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={styles.historyHeaderRow}>
                  <Text style={[styles.cardHeaderSmall, { color: colors.textSecondary }]}>
                    PAST 7 DAYS HISTORY
                  </Text>
                  <Text style={[styles.historyGoalIndicator, { color: colors.textTertiary }]}>
                    Goal: {formatDuration(goalMs)}
                  </Text>
                </View>

                <View style={styles.historyList}>
                  {history.map((dayItem) => {
                    const isOver = goalMs > 0 && dayItem.screenTimeMs > goalMs;
                    const isToday = dayItem.isToday;
                    const dayPct = goalMs > 0 ? Math.min(1.5, dayItem.screenTimeMs / goalMs) : 0;

                    return (
                      <View key={dayItem.date} style={styles.historyRow}>
                        <View style={styles.historyDateCol}>
                          <Text style={[styles.historyDayName, { color: isToday ? colors.accent : colors.textPrimary }]}>
                            {isToday ? "Today" : dayItem.dayOfWeek}
                          </Text>
                          <Text style={[styles.historyDateSub, { color: colors.textTertiary }]}>
                            {dayItem.date.slice(5)}
                          </Text>
                          {dayItem.unlockCount > 0 && (
                            <Text style={{ fontSize: 9, color: colors.textTertiary, marginTop: 1 }}>
                              {dayItem.unlockCount} unl
                            </Text>
                          )}
                        </View>

                        <View style={styles.historyBarContainer}>
                          <View style={[styles.historyBarBg, { backgroundColor: colors.border }]}>
                            <View
                              style={[
                                styles.historyBarFill,
                                {
                                  width: `${Math.min(100, (dayPct / 1.5) * 100)}%`,
                                  backgroundColor: isOver
                                    ? palette.error
                                    : dayItem.screenTimeMs > 0
                                    ? colors.accent
                                    : colors.textTertiary,
                                },
                              ]}
                            />
                          </View>
                          <Text style={[styles.historyDurationText, { color: isOver ? palette.error : colors.textPrimary }]}>
                            {formatDuration(dayItem.screenTimeMs)}
                          </Text>
                        </View>

                        <View style={styles.historyStatusBadge}>
                          {dayItem.screenTimeMs === 0 ? (
                            <Text style={{ fontSize: 11, color: colors.textTertiary }}>—</Text>
                          ) : isOver ? (
                            <View style={[styles.historyMiniPill, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
                              <Text style={{ fontSize: 10, color: palette.error, fontFamily: typography.family.semiBold }}>
                                Exceeded
                              </Text>
                            </View>
                          ) : (
                            <View style={[styles.historyMiniPill, { backgroundColor: colors.accentMuted }]}>
                              <CheckCircle2 size={11} color={colors.accentTint} />
                              <Text style={{ fontSize: 10, color: colors.accentTint, fontFamily: typography.family.semiBold }}>
                                Goal Met
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

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
  historyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  historyGoalIndicator: {
    fontSize: 11,
    fontFamily: typography.family.medium,
  },
  historyList: {
    marginTop: spacing.sm,
    gap: 10,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  historyDateCol: {
    width: 48,
  },
  historyDayName: {
    fontSize: 13,
    fontFamily: typography.family.semiBold,
  },
  historyDateSub: {
    fontSize: 10,
    fontFamily: typography.family.regular,
  },
  historyBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  historyBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  historyDurationText: {
    fontSize: 12,
    fontFamily: typography.family.medium,
    width: 58,
    textAlign: "right",
  },
  historyStatusBadge: {
    width: 68,
    alignItems: "flex-end",
  },
  historyMiniPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
