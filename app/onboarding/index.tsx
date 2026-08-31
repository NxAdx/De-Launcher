import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.accent },
          pressed && { opacity: 0.8 },
        ]}
        onPress={() => router.push("/onboarding/apps" as any)}
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
