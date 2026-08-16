/**
 * Theme Provider for De-Launcher
 *
 * Provides dark/light theme colors throughout the app.
 * Persists user preference to MMKV.
 */
import React, { createContext, useContext, useMemo, useCallback } from "react";
import { getThemeColors, ThemeColors, ThemeMode } from "./tokens";
import { useSettingsStore } from "../store/settingsStore";

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSettingsStore((s) => s.theme) || "dark";
  const setStoreTheme = useSettingsStore((s) => s.setTheme);

  const colors = useMemo(() => getThemeColors(mode), [mode]);
  const isDark = mode === "dark";

  const toggleTheme = useCallback(() => {
    const nextMode: ThemeMode = mode === "dark" ? "light" : "dark";
    setStoreTheme(nextMode);
  }, [mode, setStoreTheme]);

  const setTheme = useCallback(
    (newMode: ThemeMode) => {
      setStoreTheme(newMode);
    },
    [setStoreTheme]
  );

  const value = useMemo(
    () => ({
      mode,
      colors,
      toggleTheme,
      setTheme,
      isDark,
    }),
    [mode, colors, toggleTheme, setTheme, isDark]
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
