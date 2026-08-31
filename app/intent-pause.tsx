/**
 * Mindful Opening Protocol — Intent Pause Screen
 *
 * Psychological friction barrier for distracting apps.
 * Implements:
 * 1. Goal Definition (Must type intentional objective - copy-paste disabled)
 * 2. Time Budget (Explicit session minutes)
 * 3. Daily Focus Check (Premack's principle - acknowledgment of daily priority)
 * 4. 3-second Mindfulness Cooldown before launch
 *
 * Fully opaque OLED / solid surface with zero background bleed-through.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  Clock,
  Target,
  CheckCircle2,
  Circle,
  Sparkles,
  Flame,
  ArrowRight,
  ShieldAlert,
  X,
} from "lucide-react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import { useAppStore } from "@/src/store/appStore";
import { useTodoStore } from "@/src/store/todoStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { launchApp } from "@/src/services/appManager";
import { AppIcon } from "@/src/components/AppIcon";

const DURATION_OPTIONS = [
  { label: "3 min", valueMs: 3 * 60 * 1000, minutes: 3 },
  { label: "5 min", valueMs: 5 * 60 * 1000, minutes: 5, recommended: true },
  { label: "10 min", valueMs: 10 * 60 * 1000, minutes: 10 },
  { label: "15 min", valueMs: 15 * 60 * 1000, minutes: 15 },
];

const QUICK_GOAL_SUGGESTIONS = [
  "Quick work reply",
  "Lookup specific order/status",
  "Send important update",
  "2-Factor Auth Code",
];

const MIN_GOAL_LENGTH = 8;
const COOLDOWN_SECONDS = 3;

export default function IntentPauseScreen() {
  const { pkg, reason } = useLocalSearchParams<{ pkg?: string; reason?: string }>();
  const packageName = typeof pkg === "string" ? pkg : "";
  const scheduleReason = typeof reason === "string" ? reason : "";

  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  const installedApps = useAppStore((s) => s.installedApps);
  const grantExemption = useAppStore((s) => s.grantExemption);
  const todos = useTodoStore((s) => s.todos);
  const currentStreak = useTodoStore((s) => s.currentStreak);

  const app = installedApps.find((a) => a.packageName === packageName);
  const appLabel = app?.label || "this app";

  const [goal, setGoal] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[1]); // 5 min default
  const [taskAcknowledged, setTaskAcknowledged] = useState(false);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(COOLDOWN_SECONDS);

  const inputRef = useRef<TextInput>(null);

  // Find top uncompleted Daily Focus task if available
  const topPendingTodo = todos.find((t) => !t.completed);

  // Breathing animation for cooldown phase
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (isCooldownActive) {
      scale.value = withRepeat(
        withTiming(1.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      opacity.value = withRepeat(
        withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [isCooldownActive, scale, opacity]);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Cooldown countdown timer
  useEffect(() => {
    if (!isCooldownActive) return;

    if (cooldownLeft <= 0) {
      if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      grantExemption(packageName, selectedDuration.valueMs, goal.trim());
      router.back();
      setTimeout(() => {
        launchApp(packageName);
      }, 150);
      return;
    }

    const timer = setInterval(() => {
      setCooldownLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isCooldownActive, cooldownLeft, packageName, selectedDuration, goal, grantExemption, hapticEnabled]);

  const isGoalValid = goal.trim().length >= MIN_GOAL_LENGTH;
  // If user has pending daily focus tasks, require checking it. If no tasks, require goal only.
  const canProceed = isGoalValid && (topPendingTodo ? taskAcknowledged : true);

  const handleGoalSuggestion = (sug: string) => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoal(sug);
  };

  const handleStartSession = () => {
    if (!canProceed) {
      if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsCooldownActive(true);
    setCooldownLeft(COOLDOWN_SECONDS);
  };

  const handleCancel = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const cardSurface = isDark ? "#181818" : "#FFFFFF";
  const cardBorderColor = isDark ? "#282828" : "#E2E8F0";
  const inputSurface = isDark ? "#101010" : "#F8FAFC";

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#0A0A0A" : "#F5F5F5" }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + spacing.md,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isCooldownActive ? (
            /* Phase 2: Mindfulness Breathing Cooldown */
            <Animated.View
              entering={FadeIn.duration(300)}
              style={styles.cooldownContainer}
            >
              <View style={styles.breathingWrapper}>
                <Animated.View
                  style={[
                    styles.breathingCircle,
                    { backgroundColor: colors.accent },
                    breatheStyle,
                  ]}
                />
                <Text style={[styles.timerNumber, { color: colors.textPrimary }]}>
                  {cooldownLeft}
                </Text>
              </View>

              <Text style={[styles.cooldownTitle, { color: colors.textPrimary }]}>
                Take a mindful breath
              </Text>
              <Text style={[styles.cooldownSubtitle, { color: colors.textSecondary }]}>
                Unlocking {appLabel} for {selectedDuration.minutes} minutes.
              </Text>
              <View style={[styles.activeGoalBadge, { backgroundColor: cardSurface, borderColor: cardBorderColor }]}>
                <Target size={14} color={colors.accentTint} />
                <Text style={[styles.activeGoalText, { color: colors.textPrimary }]} numberOfLines={2}>
                  Goal: &ldquo;{goal}&rdquo;
                </Text>
              </View>
            </Animated.View>
          ) : (
            /* Phase 1: Mindful Opening Protocol Form */
            <Animated.View entering={FadeInUp.duration(250)} style={styles.formContainer}>
              {/* Header Card */}
              <View style={[styles.headerCard, { backgroundColor: cardSurface, borderColor: cardBorderColor }]}>
                <View style={styles.headerTop}>
                  <View style={styles.appIconWrapper}>
                    {app && <AppIcon app={app} size={44} showLabel={false} onPress={() => {}} />}
                  </View>
                  <View style={styles.headerTextGroup}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.appTitle, { color: colors.textPrimary }]}>
                        {appLabel}
                      </Text>
                      <View style={[styles.gateBadge, { backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "#EF4444" }]}>
                        <ShieldAlert size={11} color="#EF4444" />
                        <Text style={[styles.gateBadgeText, { color: "#EF4444" }]}>
                          Mindful Gate
                        </Text>
                      </View>
                    </View>
                    {scheduleReason ? (
                      <View style={styles.reasonRow}>
                        <Clock size={12} color={colors.warning} />
                        <Text style={[styles.reasonText, { color: colors.warning }]}>
                          {scheduleReason}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        Set your intentional goal before proceeding.
                      </Text>
                    )}
                  </View>

                  <Pressable
                    onPress={handleCancel}
                    hitSlop={12}
                    style={[styles.closeBtn, { backgroundColor: isDark ? "#222222" : "#F1F5F9" }]}
                  >
                    <X size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </View>

              {/* Step 1: Goal Definition */}
              <View style={[styles.stepCard, { backgroundColor: cardSurface, borderColor: cardBorderColor }]}>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepNumberBadge, { backgroundColor: colors.accentMuted }]}>
                    <Target size={13} color={colors.accent} strokeWidth={2.2} />
                  </View>
                  <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                    1. What is your specific goal?
                  </Text>
                </View>

                <TextInput
                  ref={inputRef}
                  value={goal}
                  onChangeText={setGoal}
                  placeholder="e.g., Check reply from Sarah about project..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  maxLength={120}
                  contextMenuHidden={true} // Anti copy-paste enforcement
                  style={[
                    styles.goalInput,
                    {
                      color: colors.textPrimary,
                      backgroundColor: inputSurface,
                      borderColor: isGoalValid ? colors.accent : cardBorderColor,
                    },
                  ]}
                />

                <View style={styles.validationRow}>
                  <Text style={[styles.charCount, { color: isGoalValid ? colors.accent : colors.textTertiary }]}>
                    {goal.trim().length} / {MIN_GOAL_LENGTH} min characters
                  </Text>
                  <Text style={[styles.antiPasteText, { color: colors.textTertiary }]}>
                    Mindful typing required
                  </Text>
                </View>

                {/* Quick suggestions */}
                <View style={styles.suggestionsRow}>
                  {QUICK_GOAL_SUGGESTIONS.map((sug, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleGoalSuggestion(sug)}
                      style={({ pressed }) => [
                        styles.sugChip,
                        {
                          backgroundColor: isDark ? "#222222" : "#F1F5F9",
                          borderColor: cardBorderColor,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={[styles.sugChipText, { color: colors.textSecondary }]}>
                        {sug}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Step 2: Time Budget */}
              <View style={[styles.stepCard, { backgroundColor: cardSurface, borderColor: cardBorderColor }]}>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepNumberBadge, { backgroundColor: colors.accentMuted }]}>
                    <Clock size={13} color={colors.accent} strokeWidth={2.2} />
                  </View>
                  <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                    2. Planned Session Time Limit
                  </Text>
                </View>

                <View style={styles.durationGrid}>
                  {DURATION_OPTIONS.map((opt) => {
                    const isSelected = selectedDuration.minutes === opt.minutes;
                    return (
                      <Pressable
                        key={opt.minutes}
                        onPress={() => {
                          if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedDuration(opt);
                        }}
                        style={[
                          styles.durationButton,
                          {
                            backgroundColor: isSelected
                              ? colors.accent
                              : isDark
                              ? "#222222"
                              : "#F1F5F9",
                            borderColor: isSelected ? colors.accent : cardBorderColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.durationText,
                            { color: isSelected ? "#FFFFFF" : colors.textPrimary },
                          ]}
                        >
                          {opt.label}
                        </Text>
                        {opt.recommended && !isSelected && (
                          <Text style={[styles.recBadge, { color: colors.accentTint }]}>
                            Rec
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Step 3: Daily Focus Prerequisite Check */}
              <View style={[styles.stepCard, { backgroundColor: cardSurface, borderColor: cardBorderColor }]}>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepNumberBadge, { backgroundColor: colors.accentMuted }]}>
                    <Sparkles size={13} color={colors.accent} strokeWidth={2.2} />
                  </View>
                  <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                    3. Daily Focus Progress
                  </Text>
                </View>

                {topPendingTodo ? (
                  <Pressable
                    onPress={() => {
                      if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTaskAcknowledged((prev) => !prev);
                    }}
                    style={[
                      styles.taskCheckRow,
                      {
                        backgroundColor: inputSurface,
                        borderColor: taskAcknowledged ? colors.accent : cardBorderColor,
                      },
                    ]}
                  >
                    {taskAcknowledged ? (
                      <CheckCircle2 size={20} color={colors.accent} />
                    ) : (
                      <Circle size={20} color={colors.textTertiary} />
                    )}
                    <View style={styles.taskTextGroup}>
                      <Text style={[styles.taskLabel, { color: colors.textPrimary }]}>
                        {topPendingTodo.text}
                      </Text>
                      <Text style={[styles.taskSubtext, { color: colors.textSecondary }]}>
                        I confirm I made progress on this today
                      </Text>
                    </View>
                  </Pressable>
                ) : (
                  <View style={styles.noTasksRow}>
                    <CheckCircle2 size={16} color={colors.accent} />
                    <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>
                      All daily tasks completed! Maintain your focus.
                    </Text>
                  </View>
                )}

                {currentStreak > 0 && (
                  <View style={styles.streakIndicator}>
                    <Flame size={13} color="#EF4444" />
                    <Text style={[styles.streakIndicatorText, { color: isDark ? "#FCA5A5" : "#DC2626" }]}>
                      {currentStreak} day intentional streak active
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <Pressable
                  onPress={handleStartSession}
                  disabled={!canProceed}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: canProceed
                        ? colors.accent
                        : isDark
                        ? "#222222"
                        : "#E2E8F0",
                      borderColor: canProceed ? colors.accent : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: canProceed ? "#FFFFFF" : colors.textTertiary },
                    ]}
                  >
                    Unlock for {selectedDuration.minutes} Minutes
                  </Text>
                  <ArrowRight size={16} color={canProceed ? "#FFFFFF" : colors.textTertiary} />
                </Pressable>

                <Pressable
                  onPress={handleCancel}
                  style={[
                    styles.cancelOutlineButton,
                    {
                      backgroundColor: isDark ? "#161616" : "#FFFFFF",
                      borderColor: cardBorderColor,
                    },
                  ]}
                >
                  <Text style={[styles.cancelOutlineText, { color: colors.textSecondary }]}>
                    I actually don&apos;t need this right now
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    flexGrow: 1,
    justifyContent: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    gap: spacing.md,
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: spacing.md,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  appIconWrapper: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextGroup: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  appTitle: {
    fontFamily: typography.family.bold,
    fontSize: 18,
  },
  gateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  gateBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  reasonText: {
    fontFamily: typography.family.medium,
    fontSize: 12,
  },
  headerSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: spacing.md + 2,
    gap: spacing.sm,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  goalInput: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    lineHeight: 18,
    borderRadius: 14,
    borderWidth: 1.2,
    padding: spacing.md,
    minHeight: 56,
    textAlignVertical: "top",
  },
  validationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  charCount: {
    fontFamily: typography.family.medium,
    fontSize: 11,
  },
  antiPasteText: {
    fontFamily: typography.family.regular,
    fontSize: 10,
    fontStyle: "italic",
  },
  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  sugChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  sugChipText: {
    fontFamily: typography.family.medium,
    fontSize: 11,
  },
  durationGrid: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  durationText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
  },
  recBadge: {
    fontFamily: typography.family.bold,
    fontSize: 9,
    marginTop: 1,
    letterSpacing: 0.2,
  },
  taskCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: 14,
    borderWidth: 1,
  },
  taskTextGroup: {
    flex: 1,
  },
  taskLabel: {
    fontFamily: typography.family.medium,
    fontSize: 12,
  },
  taskSubtext: {
    fontFamily: typography.family.regular,
    fontSize: 10,
    marginTop: 1,
  },
  noTasksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 4,
  },
  noTasksText: {
    fontFamily: typography.family.medium,
    fontSize: 11,
  },
  streakIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  streakIndicatorText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
  },
  actionsContainer: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
  },
  primaryButtonText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  cancelOutlineButton: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelOutlineText: {
    fontFamily: typography.family.medium,
    fontSize: 13,
  },
  cooldownContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingVertical: spacing["3xl"],
  },
  breathingWrapper: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  breathingCircle: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  timerNumber: {
    fontFamily: typography.family.bold,
    fontSize: 48,
    zIndex: 10,
  },
  cooldownTitle: {
    fontFamily: typography.family.bold,
    fontSize: 22,
    textAlign: "center",
  },
  cooldownSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 14,
    textAlign: "center",
  },
  activeGoalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 1.2,
    maxWidth: 320,
  },
  activeGoalText: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    flex: 1,
  },
});
