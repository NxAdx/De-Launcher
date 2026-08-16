/**
 * De-Launcher Design Tokens
 *
 * "Intentional Minimalism" — every value serves a purpose.
 * Based on an 8dp grid, OLED-first dark palette, and Inter typography.
 */

// ─── Colors ─────────────────────────────────────────────
export const palette = {
  // Core
  black: "#000000",
  white: "#FFFFFF",

  // Dark Mode Surfaces
  dark: {
    bg: "transparent",
    surface: "#0A0A0A",
    surfaceElevated: "#141414",
    surfaceOverlay: "rgba(0,0,0,0.7)",
    border: "rgba(255, 255, 255, 0.08)",
    borderFocused: "rgba(255, 255, 255, 0.16)",
  },

  // Light Mode Surfaces
  light: {
    bg: "transparent",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceOverlay: "rgba(255,255,255,0.7)",
    border: "rgba(0, 0, 0, 0.08)",
    borderFocused: "rgba(0, 0, 0, 0.16)",
  },

  // Text on dark bg
  textDark: {
    primary: "rgba(255, 255, 255, 0.87)",
    secondary: "rgba(255, 255, 255, 0.60)",
    tertiary: "rgba(255, 255, 255, 0.38)",
    disabled: "rgba(255, 255, 255, 0.20)",
  },

  // Text on light bg
  textLight: {
    primary: "rgba(0, 0, 0, 0.87)",
    secondary: "rgba(0, 0, 0, 0.60)",
    tertiary: "rgba(0, 0, 0, 0.38)",
    disabled: "rgba(0, 0, 0, 0.20)",
  },

  // Accent — a single, muted tone. Intentionally subdued.
  accent: "#94A3B8", // Slate-400 — subdued, intentional
  accentMuted: "rgba(148, 163, 184, 0.15)",

  // Semantic
  error: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
} as const;

// ─── Semantic Theme Tokens ──────────────────────────────
export type ThemeMode = "dark" | "light";

export function getThemeColors(mode: ThemeMode) {
  const isDark = mode === "dark";
  return {
    bg: isDark ? palette.dark.bg : palette.light.bg,
    surface: isDark ? palette.dark.surface : palette.light.surface,
    surfaceElevated: isDark
      ? palette.dark.surfaceElevated
      : palette.light.surfaceElevated,
    surfaceOverlay: isDark
      ? palette.dark.surfaceOverlay
      : palette.light.surfaceOverlay,
    border: isDark ? palette.dark.border : palette.light.border,
    borderFocused: isDark
      ? palette.dark.borderFocused
      : palette.light.borderFocused,
    textPrimary: isDark
      ? palette.textDark.primary
      : palette.textLight.primary,
    textSecondary: isDark
      ? palette.textDark.secondary
      : palette.textLight.secondary,
    textTertiary: isDark
      ? palette.textDark.tertiary
      : palette.textLight.tertiary,
    textDisabled: isDark
      ? palette.textDark.disabled
      : palette.textLight.disabled,
    accent: isDark ? palette.accent : "#475569",
    accentMuted: isDark ? palette.accentMuted : "rgba(71, 85, 105, 0.15)",
    error: palette.error,
    success: palette.success,
    warning: palette.warning,
  };
}

export type ThemeColors = ReturnType<typeof getThemeColors>;

// ─── Typography ─────────────────────────────────────────
export const typography = {
  family: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semiBold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
    light: "Inter_300Light",
    thin: "Inter_100Thin",
  },
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
    "4xl": 40,
    "5xl": 48,
    "6xl": 64,
    "7xl": 80,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ─── Spacing (8dp grid) ────────────────────────────────
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 56,
  "6xl": 64,
} as const;

// ─── Border Radius ──────────────────────────────────────
export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 9999,
} as const;

// ─── Shadows ────────────────────────────────────────────
export const shadows = {
  none: {},
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

// ─── Animation Durations ────────────────────────────────
export const durations = {
  instant: 100,
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

// ─── Spring Presets (react-native-reanimated) ───────────
export const springs = {
  /** Quick, snappy interactions (buttons, toggles, dock icons) */
  snappy: { damping: 15, stiffness: 280, mass: 0.6 },
  /** Gentle settling (page transitions, large element moves) */
  gentle: { damping: 20, stiffness: 180, mass: 0.8 },
  /** Bouncy feedback (lift/drop, scale pops) */
  bouncy: { damping: 12, stiffness: 200, mass: 0.5 },
  stiff: { damping: 22, stiffness: 350, mass: 0.5 },
} as const;

// ─── Layout ─────────────────────────────────────────────
export const layout = {
  screenPaddingH: spacing.xl,
  dockHeight: 80,
  appIconSize: 48,
  appIconSizeLarge: 58,
  gridColumns: 4,
  gridGap: spacing.base,
  touchTarget: 48,
  longPressDelay: 380,
} as const;
