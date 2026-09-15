/**
 * Theme Provider for De-Launcher
 *
 * Provides dark/light theme colors throughout the app.
 * Persists user preference to MMKV.
 */
import React, { createContext, useContext, useMemo, useCallback } from "react";
import { getThemeColors, ThemeColors, ThemeMode, ThemeAccent } from "./tokens";
import { useSettingsStore } from "../store/settingsStore";

interface ThemeContextType {
  mode: ThemeMode;
  accent: ThemeAccent;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  setAccent: (accent: ThemeAccent) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // De-Launcher is strictly locked to its signature OLED Deep Dark mode
  const mode: ThemeMode = "dark";
  const themeAccent = useSettingsStore((s) => s.themeAccent) || "sage";
  const setStoreAccent = useSettingsStore((s) => s.setThemeAccent);

  const colors = useMemo(() => getThemeColors("dark", themeAccent), [themeAccent]);
  const isDark = true;

  const toggleTheme = useCallback(() => {
    // No-op: Dark theme is locked
  }, []);

  const setTheme = useCallback((_newMode: ThemeMode) => {
    // No-op: Dark theme is locked
  }, []);

  const setAccent = useCallback(
    (newAccent: ThemeAccent) => {
      setStoreAccent(newAccent);
    },
    [setStoreAccent]
  );

  const value = useMemo(
    () => ({
      mode,
      accent: themeAccent,
      colors,
      toggleTheme,
      setTheme,
      setAccent,
      isDark,
    }),
    [mode, themeAccent, colors, toggleTheme, setTheme, setAccent, isDark]
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
