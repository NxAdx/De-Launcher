/**
 * Post-Session Goal Reflection Card — De-Launcher
 *
 * Appears upon returning to the home screen after completing an intentional session in a gated app.
 * Prompts user: "Did you accomplish: '{goal}' in {appLabel}?"
 * Fosters meta-awareness and intentional phone habits.
 */
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Target, CheckCircle2, AlertTriangle, X } from "lucide-react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import { useAppStore } from "@/src/store/appStore";
import { useSettingsStore } from "@/src/store/settingsStore";

export function PostSessionReflectionCard() {
  const { colors, isDark } = useTheme();
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  const session = useAppStore((s) => s.recentCompletedSession);
  const clearRecentCompletedSession = useAppStore((s) => s.clearRecentCompletedSession);
  const recordSessionReflection = useAppStore((s) => s.recordSessionReflection);

  const [feedbackGiven, setFeedbackGiven] = useState<"completed" | "distracted" | null>(null);

  // Auto-dismiss if untouched for 18 seconds
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => {
      clearRecentCompletedSession();
    }, 18000);
    return () => clearTimeout(timer);
  }, [session, clearRecentCompletedSession]);

  if (!session) return null;

  const handleOutcome = (outcome: "completed" | "distracted") => {
    if (hapticEnabled) {
      if (outcome === "completed") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }

    setFeedbackGiven(outcome);
    recordSessionReflection(outcome);

    setTimeout(() => {
      clearRecentCompletedSession();
      setFeedbackGiven(null);
    }, 1200);
  };

  const handleDismiss = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearRecentCompletedSession();
  };

  const cardSurface = isDark ? "#1A1A1A" : "#FFFFFF";
  const borderColor = isDark ? "#303030" : "#E2E8F0";

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutDown.duration(200)}
      style={[
        styles.container,
        {
          backgroundColor: cardSurface,
          borderColor,
        },
      ]}
    >
      {feedbackGiven ? (
        <View style={styles.feedbackContainer}>
          {feedbackGiven === "completed" ? (
            <>
              <CheckCircle2 size={22} color={colors.accent} />
              <Text style={[styles.feedbackTitle, { color: colors.textPrimary }]}>
                Great focus! Goal logged.
              </Text>
            </>
          ) : (
            <>
              <AlertTriangle size={22} color={colors.warning} />
              <Text style={[styles.feedbackTitle, { color: colors.textPrimary }]}>
                Awareness is progress. Keep focused!
              </Text>
            </>
          )}
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: colors.accentMuted }]}>
                <Target size={14} color={colors.accent} strokeWidth={2.4} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
                Mindful Session • {session.appLabel}
              </Text>
            </View>
            <Pressable onPress={handleDismiss} hitSlop={10} style={styles.dismissBtn}>
              <X size={15} color={colors.textTertiary} />
            </Pressable>
          </View>

          {/* Prompt */}
          <View style={styles.content}>
            <Text style={[styles.questionText, { color: colors.textPrimary }]}>
              Did you accomplish your goal?
            </Text>
            <Text style={[styles.goalQuote, { color: colors.textSecondary }]} numberOfLines={2}>
              &ldquo;{session.goal}&rdquo;
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              onPress={() => handleOutcome("completed")}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.completedBtn,
                { backgroundColor: isDark ? "#222F24" : "#DCFCE7", borderColor: "#22C55E" },
                pressed && { opacity: 0.8 },
              ]}
            >
              <CheckCircle2 size={15} color={isDark ? "#4ADE80" : "#16A34A"} />
              <Text style={[styles.actionBtnText, { color: isDark ? "#86EFAC" : "#15803D" }]}>
                Yes, done
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleOutcome("distracted")}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.distractedBtn,
                { backgroundColor: isDark ? "#2D1D1D" : "#FEE2E2", borderColor: "#EF4444" },
                pressed && { opacity: 0.8 },
              ]}
            >
              <AlertTriangle size={15} color={isDark ? "#F87171" : "#DC2626"} />
              <Text style={[styles.actionBtnText, { color: isDark ? "#FCA5A5" : "#B91C1C" }]}>
                Got distracted
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 20,
    borderWidth: 1.2,
    padding: spacing.md,
    zIndex: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  iconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  dismissBtn: {
    padding: 4,
  },
  content: {
    marginVertical: 4,
  },
  questionText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
  },
  goalQuote: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    marginTop: 2,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
  },
  completedBtn: {},
  distractedBtn: {},
  actionBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
  },
  feedbackContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  feedbackTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13,
  },
});
