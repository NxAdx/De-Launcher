/**
 * OriginOSPageIndicator & DotsPageIndicator Components
 *
 * OriginOSPageIndicator:
 * Modeled directly after Vivo (OriginOS / FuntouchOS) desktop page indicator.
 * Format:
 *   [ = ]   [ 3/11 ]
 * - Left: Two horizontal rounded grab bars (=)
 * - Right: Compact page fraction (e.g. 1/3, 3/11)
 * - Clean, distraction-free typography with soft drop shadow for perfect wallpaper legibility
 * - Interactive: Tap to advance to the next page with haptic feedback
 *
 * DotsPageIndicator:
 * Classic minimalist dots indicator with active dot scaling.
 */
import React, { useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { useSettingsStore } from "@/src/store/settingsStore";
import { typography, spacing } from "@/src/theme/tokens";

export interface PageIndicatorProps {
  activePage: number;
  numPages: number;
  onPageSelect?: (pageIndex: number) => void;
}

export function OriginOSPageIndicator({
  activePage,
  numPages,
  onPageSelect,
}: PageIndicatorProps) {
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

  return (
    <View style={vivoStyles.outerContainer}>
      <Pressable
        onPress={handlePress}
        hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
        style={({ pressed }) => [
          vivoStyles.container,
          pressed && vivoStyles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Page ${activePage + 1} of ${numPages}. Tap for next page.`}
      >
        {/* Minimal page fraction: e.g. 1/13 */}
        <Text style={[vivoStyles.pageText, { color: textColor }]}>
          {activePage + 1}/{numPages}
        </Text>
      </Pressable>
    </View>
  );
}

export function DotsPageIndicator({
  activePage,
  numPages,
  onPageSelect,
}: PageIndicatorProps) {
  const { colors, isDark } = useTheme();
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);
  const MAX_VISIBLE_DOTS = 6;

  let start = 0;
  let end = numPages;
  if (numPages > MAX_VISIBLE_DOTS) {
    start = Math.max(
      0,
      Math.min(
        activePage - Math.floor(MAX_VISIBLE_DOTS / 2),
        numPages - MAX_VISIBLE_DOTS
      )
    );
    end = start + MAX_VISIBLE_DOTS;
  }

  const handlePress = useCallback(
    (pageIndex: number) => {
      if (hapticEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPageSelect?.(pageIndex);
    },
    [hapticEnabled, onPageSelect]
  );

  if (numPages <= 1) return null;

  return (
    <View style={dotsStyles.container}>
      {Array.from({ length: end - start }).map((_, idx) => {
        const i = start + idx;
        const isEdge = numPages > MAX_VISIBLE_DOTS && (idx === 0 || idx === end - start - 1);
        const isActive = i === activePage;
        return (
          <Pressable
            key={i}
            onPress={() => handlePress(i)}
            hitSlop={8}
            style={[
              dotsStyles.dot,
              {
                backgroundColor: isActive
                  ? (isDark ? "#FFFFFF" : colors.textPrimary)
                  : (isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.25)"),
                transform: [
                  { scale: isActive ? 1.3 : isEdge ? 0.65 : 1 },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const vivoStyles = StyleSheet.create({
  outerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 1,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  pressed: {
    opacity: 0.6,
    transform: [{ scale: 0.96 }],
  },
  pageText: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 0.3,
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

const dotsStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    height: 16,
    width: "100%",
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
