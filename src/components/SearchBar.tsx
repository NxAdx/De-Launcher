/**
 * SearchBar Component
 *
 * Minimal search input for the app drawer.
 * Animated focus states. Haptic feedback on focus.
 */
import React, { useRef, useCallback } from "react";
import { TextInput, StyleSheet, Pressable, TextInputProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { Search, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing, radii, durations } from "@/src/theme/tokens";

interface SearchBarProps extends Omit<TextInputProps, "style"> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  ...rest
}: SearchBarProps) {
  const { colors, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const focusProgress = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [
        isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        isDark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.20)",
      ]
    ),
    backgroundColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [
        isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
        isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      ]
    ),
  }));

  const handleFocus = useCallback(() => {
    focusProgress.value = withTiming(1, { duration: durations.fast });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [focusProgress]);

  const handleBlur = useCallback(() => {
    focusProgress.value = withTiming(0, { duration: durations.fast });
  }, [focusProgress]);

  const handleClear = useCallback(() => {
    onChangeText("");
    onClear?.();
    inputRef.current?.focus();
  }, [onChangeText, onClear]);

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Search
        size={18}
        color={colors.textTertiary}
        style={styles.searchIcon}
      />
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: colors.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Search apps..."
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.accent}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        {...rest}
      />
      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          style={styles.clearButton}
          hitSlop={12}
        >
          <X size={16} color={colors.textTertiary} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.xl,
    borderWidth: 1,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.base,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.md,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  clearButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
});
