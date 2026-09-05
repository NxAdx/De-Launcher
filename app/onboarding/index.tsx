import React, { useRef } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import { signalNavigation } from "@/app/_layout";
import { useSettingsStore } from "@/src/store/settingsStore";

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);
  const isNavigatingRef = useRef(false);

  const handleContinue = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 800);

    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    signalNavigation(2000);

    try {
      router.push("/onboarding/apps" as any);
    } catch (pushErr) {
      console.warn("[WelcomeScreen] router.push failed, attempting router.navigate:", pushErr);
      try {
        router.navigate("/onboarding/apps" as any);
      } catch (navErr) {
        console.error("[WelcomeScreen] Navigation to apps failed:", navErr);
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing["2xl"], paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.content}>
        <Image
          source={require("@/assets/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Welcome to{"\n"}De-Launcher
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          A calmer, faster Android home screen.{"\n"}
          Designed for focus, without friction.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue to choose apps"
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.accent },
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        ]}
        onPress={handleContinue}
      >
        <Text style={[styles.buttonText, { color: "#0A0A0A" }]}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.family.bold,
    fontSize: typography.size["4xl"],
    lineHeight: 48,
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.lg,
    lineHeight: 28,
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
