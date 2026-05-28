/**
 * Clock Component
 *
 * Large, minimal time display for the homescreen.
 * Updates every minute. Typography-first design with contextual greeting.
 */
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
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

/** Returns a contextual greeting based on the hour of day. */
function getGreeting(date: Date): string {
  const h = date.getHours();
  if (h >= 5 && h <= 11) return "Good morning";
  if (h >= 12 && h <= 16) return "Good afternoon";
  return "Good evening";
}

export function Clock() {
  const { colors } = useTheme();
  const [now, setNow] = useState(new Date());

  const tick = useCallback(() => setNow(new Date()), []);

  useEffect(() => {
    // Compute delay from a fresh Date so we don't re-fire on every render
    const fresh = new Date();
    const msToNextMinute =
      (60 - fresh.getSeconds()) * 1000 - fresh.getMilliseconds();

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
  }, [tick]);

  return (
    <View style={styles.container}>
      {/* Greeting — staggered entrance */}
      <Animated.Text
        entering={FadeInUp.duration(400)}
        style={[styles.greeting, { color: colors.textTertiary }]}
      >
        {getGreeting(now)}
      </Animated.Text>

      {/* Time row */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(60)}
        style={styles.timeRow}
      >
        <Text style={[styles.time, { color: colors.textPrimary }]}>
          {formatTime(now)}
        </Text>
        <Text style={[styles.period, { color: colors.textTertiary }]}>
          {formatPeriod(now)}
        </Text>
      </Animated.View>

      {/* Date */}
      <Animated.Text
        entering={FadeInUp.duration(400).delay(120)}
        style={[styles.date, { color: colors.textSecondary }]}
      >
        {formatDate(now)}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["3xl"],
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
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
    marginBottom: spacing.sm,
  },
  date: {
    fontFamily: typography.family.light,
    fontSize: typography.size.base,
    marginTop: spacing.xxs,
    letterSpacing: 0.5,
  },
});
