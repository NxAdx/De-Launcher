/**
 * OriginOSPageIndicator Component
 *
 * Modeled directly after Vivo (OriginOS / FuntouchOS) desktop page indicator.
 * Layout:
 *   [ = ]   [ 3/11 ]
 * - Left: Two horizontal rounded grab bars (=)
 * - Right: Compact page fraction (e.g. 1/3, 3/11)
 * - Clean, distraction-free typography with soft drop shadow for perfect wallpaper legibility
 * - Interactive: Tap to advance to the next page with haptic feedback
 */
import React, { useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { useSettingsStore } from "@/src/store/settingsStore";
import { typography } from "@/src/theme/tokens";

interface OriginOSPageIndicatorProps {
  activePage: number;
  numPages: number;
  onPageSelect?: (pageIndex: number) => void;
}

export function OriginOSPageIndicator({
  activePage,
  numPages,
  onPageSelect,
}: OriginOSPageIndicatorProps) {
  const { colors, isDark } = useTheme();
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  const handlePress = useCallback(() => {
    if (numPages <= 1) return;
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const nextPage = (activePage + 1) % numPages;
    onPageSelect?.(nextPage);
  }, [activePage, numPages, hapticEnabled, onPageSelect]);

  if (numPages <= 1) return null;

  const textColor = isDark ? "#FFFFFF" : colors.textPrimary;
  const barColor = isDark ? "rgba(255, 255, 255, 0.85)" : colors.textPrimary;

  return (
    <View style={styles.outerContainer}>
      <Pressable
        onPress={handlePress}
        hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Page ${activePage + 1} of ${numPages}. Tap for next page.`}
      >
        {/* Vivo grab handle: Two stacked horizontal rounded bars (=) */}
        <View style={styles.handleWrapper}>
          <View style={[styles.handleBar, { backgroundColor: barColor }]} />
          <View style={[styles.handleBar, { backgroundColor: barColor }]} />
        </View>

        {/* Vivo page fraction: e.g. 3/11 */}
        <Text style={[styles.pageText, { color: textColor }]}>
          {activePage + 1}/{numPages}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 4,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.65,
    transform: [{ scale: 0.94 }],
  },
  handleWrapper: {
    width: 14,
    height: 10,
    justifyContent: "center",
    gap: 3,
  },
  handleBar: {
    width: 14,
    height: 2.2,
    borderRadius: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.45,
    shadowRadius: 2,
    elevation: 2,
  },
  pageText: {
    fontFamily: typography.family.medium,
    fontSize: 15,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
