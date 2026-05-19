/**
 * Theme Provider for De-Launcher
 *
 * Provides dark/light theme colors throughout the app.
 * Persists user preference to MMKV.
 */
import React, { createContext, useContext, useMemo, useCallback } from "react";
import { useColorScheme } from "react-native";
import { getThemeColors, ThemeColors, ThemeMode } from "./tokens";
import { useSettingsStore } from "@/src/store/settingsStore";

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { theme: storedTheme, setTheme: setStoredTheme } = useSettingsStore();

  // Determine active mode: stored preference > system
  const mode: ThemeMode = storedTheme ?? (systemScheme === "dark" ? "dark" : "light");

  const colors = useMemo(() => getThemeColors(mode), [mode]);

  const toggleTheme = useCallback(() => {
    setStoredTheme(mode === "dark" ? "light" : "dark");
  }, [mode, setStoredTheme]);

  const setTheme = useCallback(
    (newMode: ThemeMode) => setStoredTheme(newMode),
    [setStoredTheme]
  );

  const value = useMemo(
    () => ({
      mode,
      colors,
      toggleTheme,
      setTheme,
      isDark: mode === "dark",
    }),
    [mode, colors, toggleTheme, setTheme]
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
