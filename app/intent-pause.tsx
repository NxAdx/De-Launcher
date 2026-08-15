import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
  FadeInUp,
  FadeInDown,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Clock } from "lucide-react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing, radii } from "@/src/theme/tokens";
import { useAppStore } from "@/src/store/appStore";
import { launchApp } from "@/src/services/appManager";

const BREATHE_DURATION = 5; // 5 seconds
const EXEMPTION_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export default function IntentPauseScreen() {
  const { pkg, reason } = useLocalSearchParams<{ pkg?: string; reason?: string }>();
  const packageName = typeof pkg === "string" ? pkg : "";
  const scheduleReason = typeof reason === "string" ? reason : "";

  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const installedApps = useAppStore((s) => s.installedApps);
  const grantExemption = useAppStore((s) => s.grantExemption);

  const [timeLeft, setTimeLeft] = useState(BREATHE_DURATION);
  const [canLaunch, setCanLaunch] = useState(false);

  const app = installedApps.find((a) => a.packageName === packageName);
  const appLabel = app?.label || "this app";

  // Breathing animation
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.5, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(0.2, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [scale, opacity]);

  const breatheStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanLaunch(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleLaunch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    grantExemption(packageName, EXEMPTION_DURATION_MS);
    router.back();
    setTimeout(() => {
      launchApp(packageName);
    }, 150);
  };

  return (
    <View style={styles.container}>
      <BlurView
        intensity={isDark ? 80 : 40}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Animated.View
          entering={FadeInUp.duration(600).delay(100)}
          style={styles.textContainer}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Intent Pause
          </Text>

          {scheduleReason ? (
            <View style={styles.reasonBadge}>
              <Clock size={14} color={colors.warning} />
              <Text style={[styles.reasonText, { color: colors.warning }]}>
                {scheduleReason}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Take a deep breath before opening {appLabel}.
          </Text>
        </Animated.View>

        <View style={styles.breathingContainer}>
          <Animated.View
            style={[
              styles.breathingCircle,
              { backgroundColor: colors.accent },
              breatheStyle,
            ]}
          />
          <Text style={[styles.timerText, { color: colors.textPrimary }]}>
            {timeLeft > 0 ? timeLeft : ""}
          </Text>
        </View>

        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.actionsContainer}
        >
          {canLaunch ? (
            <Animated.View entering={FadeIn.duration(400)}>
              <Pressable
                style={[styles.launchButton, { backgroundColor: colors.accent }]}
                onPress={handleLaunch}
              >
                <Text style={styles.launchButtonText}>Continue to App</Text>
              </Pressable>
              <Text style={[styles.exemptionText, { color: colors.textTertiary }]}>
                Unlocks for 15 minutes
              </Text>
            </Animated.View>
          ) : (
            <View style={styles.launchButtonPlaceholder} />
          )}

          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <Text
              style={[styles.cancelButtonText, { color: colors.textSecondary }]}
            >
              I actually don&apos;t need this
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["4xl"],
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  textContainer: {
    alignItems: "center",
    marginTop: spacing["2xl"],
  },
  title: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xl,
    marginBottom: spacing.xs,
  },
  reasonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  reasonText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
  },
  subtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    textAlign: "center",
    maxWidth: 280,
  },
  breathingContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  breathingCircle: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  timerText: {
    fontFamily: typography.family.semiBold,
    fontSize: 48,
    zIndex: 10,
  },
  actionsContainer: {
    width: "100%",
    alignItems: "center",
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  launchButtonPlaceholder: {
    height: 56 + 20,
  },
  launchButton: {
    width: 220,
    height: 56,
    borderRadius: radii.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  launchButtonText: {
    fontFamily: typography.family.semiBold,
    fontSize: typography.size.base,
    color: "#0A0A0A",
  },
  exemptionText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    textAlign: "center",
  },
  cancelButton: {
    padding: spacing.md,
  },
  cancelButtonText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
  },
});
