/**
 * Theme Provider for De-Launcher
 *
 * Provides dark/light theme colors throughout the app.
 * Persists user preference to MMKV.
 */
import React, { createContext, useContext, useMemo, useCallback } from "react";
import { getThemeColors, ThemeColors, ThemeMode } from "./tokens";

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Permanently force OLED Dark Mode
  const mode: ThemeMode = "dark";
  const colors = useMemo(() => getThemeColors("dark"), []);

  const toggleTheme = useCallback(() => {
    // No-op to preserve interface compatibility
  }, []);

  const setTheme = useCallback(
    (newMode: ThemeMode) => {
      // No-op to preserve interface compatibility
    },
    []
  );

  const value = useMemo(
    () => ({
      mode,
      colors,
      toggleTheme,
      setTheme,
      isDark: true,
    }),
    [colors, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
