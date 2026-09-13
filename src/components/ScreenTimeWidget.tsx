/**
 * ScreenTimeWidget Component — De-Launcher
 *
 * Minimalist, glanceable digital wellbeing widget placed on the home screen.
 * Rooted in behavioral self-monitoring psychology and inspired by Olauncher and Lawnchair.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  AppState,
  AppStateStatus,
} from "react-native";
import { Smartphone, Flame, ChevronRight, ShieldAlert } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { spacing, palette } from "@/src/theme/tokens";
import { useSettingsStore } from "@/src/store/settingsStore";
import { useWellbeingStore } from "@/src/store/wellbeingStore";
import {
  hasUsageStatsPermission,
  getScreenTimeToday,
  openUsageStatsSettings,
} from "@/modules/de-launcher-native";
import { ScreenTimeModal } from "./ScreenTimeModal";

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function ScreenTimeWidget() {
  const { colors } = useTheme();
  const showScreenTime = useSettingsStore((s) => s.showScreenTimeWidget);
  const goalMs = useSettingsStore((s) => s.screenTimeGoalMs);
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  const streak = useWellbeingStore((s) => s.currentScreenStreak);
  const evaluateDayStreak = useWellbeingStore((s) => s.evaluateDayStreak);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [screenTimeMs, setScreenTimeMs] = useState(0);
  const [unlockCount, setUnlockCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(0);

  const checkData = useCallback(async () => {
    try {
      const permitted = await hasUsageStatsPermission();
      setHasPermission(permitted);
      if (!permitted) return;

      // Throttle: don't query more than once per minute
      const now = Date.now();
      if (now - lastUpdated < 60 * 1000 && lastUpdated > 0) return;

      const data = await getScreenTimeToday();
      setScreenTimeMs(data.screenTimeMs);
      setUnlockCount(data.unlockCount);
      setLastUpdated(now);

      // Evaluate yesterday's streak rollover
      evaluateDayStreak(data.screenTimeMs, goalMs);
    } catch {
      // Fallback
    }
  }, [goalMs, evaluateDayStreak, lastUpdated]);

  useEffect(() => {
    if (!showScreenTime) return;
    checkData();

    const subscription = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        checkData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [showScreenTime, checkData]);

  if (!showScreenTime) return null;

  const handlePress = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!hasPermission) {
      openUsageStatsSettings();
      return;
    }
    setShowModal(true);
  };

  const progress = goalMs > 0 ? Math.min(1, screenTimeMs / goalMs) : 0;
  const progressPercent = Math.round((screenTimeMs / (goalMs || 1)) * 100);

  const getProgressColor = () => {
    if (progressPercent >= 100) return palette.error;
    if (progressPercent >= 80) return palette.warning;
    return colors.accent;
  };

  return (
    <>
      <View style={styles.wrapper}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.container,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
            pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open screen time digital wellbeing summary"
        >
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.iconCircle,
                {
                  borderColor: hasPermission === false ? palette.warning : colors.accent,
                  backgroundColor:
                    hasPermission === false
                      ? "rgba(245, 158, 11, 0.15)"
                      : colors.accentMuted,
                },
              ]}
            >
              {hasPermission === false ? (
                <ShieldAlert size={15} color={palette.warning} strokeWidth={2.2} />
              ) : (
                <Smartphone size={15} color={colors.accent} strokeWidth={2.2} />
              )}
            </View>

            <View style={styles.textGroup}>
              <View style={styles.topRow}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {hasPermission === false ? "PERMISSION REQUIRED" : "SCREEN TIME"}
                </Text>
                {hasPermission !== false && (
                  <View style={styles.badgeRow}>
                    {streak > 0 && (
                      <View style={[styles.streakBadge, { backgroundColor: colors.accentMuted }]}>
                        <Flame size={11} color={colors.accentTint} strokeWidth={2.2} />
                        <Text style={[styles.streakText, { color: colors.accentTint }]}>
                          {streak}d
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.timeText, { color: colors.accentTint }]}>
                      {formatDuration(screenTimeMs)}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {hasPermission === false
                  ? "Tap to grant Usage Access permission"
                  : `${progressPercent}% of ${formatDuration(goalMs)} goal · ${unlockCount} unlocks`}
              </Text>

              {hasPermission !== false && (
                <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: getProgressColor(),
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          </View>

          <ChevronRight size={18} color={colors.textSecondary} style={{ marginRight: 2 }} />
        </Pressable>
      </View>

      <ScreenTimeModal
        visible={showModal}
        screenTimeMs={screenTimeMs}
        unlockCount={unlockCount}
        onClose={() => {
          setShowModal(false);
          checkData();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.xl,
    marginVertical: spacing.xs,
    width: "100%",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    borderRadius: 16,
    borderWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm + 2,
  },
  textGroup: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 10,
    fontWeight: "700",
  },
  timeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },
  progressBarBg: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 6,
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
});
