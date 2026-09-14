/**
 * De-Launcher Design Tokens
 *
 * "Intentional Minimalism" — every value serves a purpose.
 * Based on an 8dp grid, OLED-first dark palette, and Inter typography.
 */

// ─── Colors (Design System v1.0 — Sage Green Identity & Wallpaper Contrast) ─────
export const palette = {
  // Core
  black: "#000000",
  white: "#FFFFFF",

  // Dark Mode Surfaces
  dark: {
    bg: "#000000",
    surface: "#121212",
    surfaceElevated: "#181818",
    surfaceOverlay: "rgba(0,0,0,0.7)",
    cardBg: "rgba(18, 18, 18, 0.78)",
    cardBorder: "rgba(255, 255, 255, 0.16)",
    border: "#242424",
    borderFocused: "#343434",
  },

  // Light Mode Surfaces
  light: {
    bg: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceOverlay: "rgba(255, 255, 255, 0.85)",
    cardBg: "rgba(255, 255, 255, 0.92)",
    cardBorder: "rgba(0, 0, 0, 0.10)",
    border: "rgba(0, 0, 0, 0.08)",
    borderFocused: "rgba(0, 0, 0, 0.16)",
  },

  // Text on dark / wallpaper bg
  textDark: {
    primary: "#FFFFFF",
    secondary: "#E2E8F0",
    tertiary: "#94A3B8",
    disabled: "rgba(255, 255, 255, 0.20)",
  },

  // Text on light bg
  textLight: {
    primary: "#171916",
    secondary: "#475569",
    tertiary: "#64748B",
    disabled: "rgba(0, 0, 0, 0.20)",
  },

  // Accent — Sage Green. The single brand signal.
  accent: "#657D5C",
  accentMuted: "rgba(101, 125, 92, 0.20)",
  // Lighter tint for decorative elements & high readability over dark/photo wallpapers
  accentTint: "#A3B899",

  // Semantic
  error: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
} as const;

// ─── Theme Accent Palettes ──────────────────────────────
export type ThemeAccent = "sage" | "slate" | "amber" | "monochrome";

export interface AccentPreset {
  id: ThemeAccent;
  name: string;
  previewColor: string;
  accent: string;
  accentTint: string;
  accentMuted: string;
  accentText: string;
  lightAccent: string;
  lightAccentText: string;
}

export const ACCENT_PRESETS: Record<ThemeAccent, AccentPreset> = {
  sage: {
    id: "sage",
    name: "Sage Oasis",
    previewColor: "#8EAB82",
    accent: "#8EAB82",
    accentTint: "#A3B899",
    accentMuted: "rgba(142, 171, 130, 0.18)",
    accentText: "#0D150C",
    lightAccent: "#4F6548",
    lightAccentText: "#FFFFFF",
  },
  slate: {
    id: "slate",
    name: "Nordic Slate",
    previewColor: "#7E99A8",
    accent: "#7E99A8",
    accentTint: "#9DB3C0",
    accentMuted: "rgba(126, 153, 168, 0.18)",
    accentText: "#0A1217",
    lightAccent: "#3B596A",
    lightAccentText: "#FFFFFF",
  },
  amber: {
    id: "amber",
    name: "Warm Sand",
    previewColor: "#C4A482",
    accent: "#C4A482",
    accentTint: "#D6BCA0",
    accentMuted: "rgba(196, 164, 130, 0.18)",
    accentText: "#181108",
    lightAccent: "#7C5C38",
    lightAccentText: "#FFFFFF",
  },
  monochrome: {
    id: "monochrome",
    name: "Monochrome",
    previewColor: "#E2E8F0",
    accent: "#FFFFFF",
    accentTint: "#E2E8F0",
    accentMuted: "rgba(255, 255, 255, 0.14)",
    accentText: "#000000",
    lightAccent: "#171916",
    lightAccentText: "#FFFFFF",
  },
};

// ─── Semantic Theme Tokens ──────────────────────────────
export type ThemeMode = "dark" | "light";

export function getThemeColors(mode: ThemeMode, accentKey: ThemeAccent = "sage") {
  const isDark = mode === "dark";
  const preset = ACCENT_PRESETS[accentKey] || ACCENT_PRESETS.sage;

  return {
    bg: isDark ? palette.dark.bg : palette.light.bg,
    surface: isDark ? palette.dark.surface : palette.light.surface,
    surfaceElevated: isDark
      ? palette.dark.surfaceElevated
      : palette.light.surfaceElevated,
    surfaceOverlay: isDark
      ? palette.dark.surfaceOverlay
      : palette.light.surfaceOverlay,
    cardBg: isDark ? palette.dark.cardBg : palette.light.cardBg,
    cardBorder: isDark ? palette.dark.cardBorder : palette.light.cardBorder,
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
    accent: isDark ? preset.accent : preset.lightAccent,
    accentMuted: preset.accentMuted,
    accentTint: isDark ? preset.accentTint : preset.lightAccent,
    accentText: isDark ? preset.accentText : preset.lightAccentText,
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
  lg: 16,
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

// ─── Spring Presets (react-native-reanimated, tuned for 120fps) ─────
export const springs = {
  /** Quick, snappy interactions (buttons, toggles, dock icons) */
  snappy: { damping: 20, stiffness: 400, mass: 0.4 },
  /** Gentle settling (page transitions, large element moves) */
  gentle: { damping: 22, stiffness: 260, mass: 0.5 },
  /** Bouncy feedback (lift/drop, scale pops) */
  bouncy: { damping: 14, stiffness: 300, mass: 0.35 },
  /** Stiff, no-overshoot (grid repositioning, layout shifts) */
  stiff: { damping: 28, stiffness: 450, mass: 0.4 },
  /** Ultra-responsive for drag tracking */
  drag: { damping: 24, stiffness: 500, mass: 0.3 },
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
