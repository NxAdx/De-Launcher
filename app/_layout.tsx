/**
 * Root Layout — De-Launcher
 *
 * Wraps the entire app with:
 * - Font loading (Inter family)
 * - Theme provider
 * - Gesture handler root
 * - System UI configuration
 * - Splash screen management
 */
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import {
  useFonts,
  Inter_100Thin,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { ThemeProvider, useTheme } from "@/src/theme/ThemeContext";
import { useAppStore } from "@/src/store/appStore";
import {
  getInstalledApps,
  DEFAULT_DOCK_PACKAGES,
  DEFAULT_ALLOWED_PACKAGES,
} from "@/src/services/appManager";

// Prevent splash auto-hide
SplashScreen.preventAutoHideAsync();

// Set system background to pure black
SystemUI.setBackgroundColorAsync("#000000");

function RootLayoutContent() {
  const { colors, isDark } = useTheme();
  const {
    setInstalledApps,
    dockPackages,
    reorderDock,
    allowedPackages,
    setAllowedPackages,
  } = useAppStore();

  useEffect(() => {
    async function loadApps() {
      const apps = await getInstalledApps();
      setInstalledApps(apps);

      // Set defaults on first run
      if (dockPackages.length === 0) {
        reorderDock(DEFAULT_DOCK_PACKAGES);
      }
      if (allowedPackages.length === 0) {
        setAllowedPackages(DEFAULT_ALLOWED_PACKAGES);
      }
    }
    loadApps();
  }, [
    allowedPackages.length,
    dockPackages.length,
    reorderDock,
    setAllowedPackages,
    setInstalledApps,
  ]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="drawer"
          options={{
            animation: "slide_from_bottom",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            animation: "slide_from_right",
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_100Thin,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000" }}>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
