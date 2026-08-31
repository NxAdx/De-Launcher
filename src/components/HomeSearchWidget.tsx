/**
 * HomeSearchWidget Component
 *
 * Customizable search bar for the homescreen.
 * Tapping opens the Universal Command Bar with smooth animation.
 */
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Search } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import { useSettingsStore, SearchWidgetStyle } from "@/src/store/settingsStore";
import { signalNavigation } from "@/app/_layout";

interface HomeSearchWidgetProps {
  styleOverride?: SearchWidgetStyle;
}

export function HomeSearchWidget({ styleOverride }: HomeSearchWidgetProps) {
  const { colors, isDark } = useTheme();
  const showSearchWidget = useSettingsStore((s) => s.showHomeSearchWidget);
  const defaultWidgetStyle = useSettingsStore((s) => s.searchWidgetStyle);
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  const widgetStyle = styleOverride ?? defaultWidgetStyle;

  if (!showSearchWidget) return null;

  const handlePress = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    signalNavigation();
    router.push("/search" as any);
  };

  const getContainerStyle = () => {
    switch (widgetStyle) {
      case "pill":
        return [
          styles.pillContainer,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ];
      case "rounded":
        return [
          styles.roundedContainer,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ];
      case "minimal":
        return [
          styles.minimalContainer,
          {
            borderBottomColor: colors.cardBorder,
          },
        ];
      default:
        return [
          styles.pillContainer,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ];
    }
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.baseContainer,
          getContainerStyle(),
          pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Search apps and actions"
      >
        <Search size={18} color={colors.textSecondary} style={styles.icon} />
        <Text
          style={[styles.placeholderText, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          Search apps, settings, actions...
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.xl,
    marginVertical: spacing.sm,
    width: "100%",
  },
  baseContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  pillContainer: {
    borderRadius: 24,
    borderWidth: 1.2,
  },
  roundedContainer: {
    borderRadius: 14,
    borderWidth: 1.2,
  },
  minimalContainer: {
    borderRadius: 0,
    borderBottomWidth: 1.5,
    paddingHorizontal: spacing.xs,
    height: 42,
  },
  icon: {
    marginRight: spacing.sm,
  },
  placeholderText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    flex: 1,
  },
});
