/**
 * Clock Component
 *
 * Large, minimal time display for the homescreen.
 * Updates every minute. Typography-first design.
 */
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const h = hours % 12 || 12;
  return `${h}:${minutes}`;
}

function formatPeriod(date: Date): string {
  return date.getHours() >= 12 ? "PM" : "AM";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function Clock() {
  const { colors } = useTheme();
  const [now, setNow] = useState(new Date());

  const tick = useCallback(() => setNow(new Date()), []);

  useEffect(() => {
    // Align to the next minute boundary for efficiency
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    let interval: ReturnType<typeof setInterval> | undefined;
    const alignTimeout = setTimeout(() => {
      tick();
      // Then tick every 60s
      interval = setInterval(tick, 60_000);
    }, msToNextMinute);

    return () => {
      clearTimeout(alignTimeout);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [now, tick]);

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.container}>
      <View style={styles.timeRow}>
        <Text style={[styles.time, { color: colors.textPrimary }]}>
          {formatTime(now)}
        </Text>
        <Text style={[styles.period, { color: colors.textTertiary }]}>
          {formatPeriod(now)}
        </Text>
      </View>
      <Text style={[styles.date, { color: colors.textSecondary }]}>
        {formatDate(now)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["3xl"],
    paddingBottom: spacing.lg,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  time: {
    fontFamily: typography.family.thin,
    fontSize: typography.size["7xl"],
    letterSpacing: -3,
    includeFontPadding: false,
  },
  period: {
    fontFamily: typography.family.light,
    fontSize: typography.size.lg,
    marginBottom: 8,
  },
  date: {
    fontFamily: typography.family.light,
    fontSize: typography.size.base,
    marginTop: spacing.xxs,
    letterSpacing: 0.5,
  },
});
