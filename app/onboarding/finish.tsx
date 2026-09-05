import React, { useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as IntentLauncher from "expo-intent-launcher";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import { useSettingsStore } from "@/src/store/settingsStore";
import { promptSetDefaultLauncher } from "@/src/services/appManager";
import { signalNavigation } from "@/app/_layout";

export default function FinishScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const setHasCompletedOnboarding = useSettingsStore((s) => s.setHasCompletedOnboarding);
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);
  const isNavigatingRef = useRef(false);

  const completeOnboarding = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 800);

    signalNavigation(2000);
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setHasCompletedOnboarding(true);

    try {
      router.replace("/");
    } catch (err) {
      console.warn("[FinishScreen] router.replace failed, trying router.navigate:", err);
      try {
        router.navigate("/");
      } catch (e2) {
        console.error("[FinishScreen] Failed to return to home:", e2);
      }
    }
  };

  const openHomeSettings = async () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    signalNavigation(2000);
    try {
      await promptSetDefaultLauncher();
    } catch (e) {
      console.warn("Could not open home settings via native module, trying IntentLauncher:", e);
      try {
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.HOME_SETTINGS);
      } catch (err2) {
        console.warn("Could not open home settings via IntentLauncher:", err2);
      }
    }
  };

  const openAccessibilitySettings = async () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    signalNavigation(2000);
    try {
      await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.ACCESSIBILITY_SETTINGS);
    } catch (e) {
      console.warn("Could not open accessibility settings", e);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Almost Done</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          To get the most out of De-Launcher, you&apos;ll need to set it up in your Android Settings.
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <View style={[styles.actionCard, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>1. Set as Default Home</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            Make De-Launcher your default home screen so it appears when you press the home button.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Android Home Settings"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [styles.secondaryButton, { backgroundColor: 'rgba(255,255,255,0.1)' }, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
            onPress={openHomeSettings}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Open Home Settings</Text>
          </Pressable>
        </View>

        <View style={[styles.actionCard, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>2. Enable Focus Blocking</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            Enable the De-Launcher Accessibility Service to automatically block distracting apps.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Android Accessibility Settings"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [styles.secondaryButton, { backgroundColor: 'rgba(255,255,255,0.1)' }, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
            onPress={openAccessibilitySettings}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Open Accessibility Settings</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Finish Setup and go to home screen"
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
          ]}
          onPress={completeOnboarding}
        >
          <Text style={[styles.buttonText, { color: "#0A0A0A" }]}>Finish Setup</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.family.bold,
    fontSize: typography.size["3xl"],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: 24,
  },
  actionsContainer: {
    flex: 1,
    gap: spacing.lg,
  },
  actionCard: {
    padding: spacing.lg,
    borderRadius: 16,
  },
  cardTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  secondaryButton: {
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    alignSelf: "flex-start",
  },
  secondaryButtonText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
  },
  footer: {
    paddingTop: spacing.lg,
  },
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
  },
});
