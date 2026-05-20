/**
 * Root Layout — De-Launcher
 *
 * Wraps the entire app with:
 * - Font loading (Inter family)
 * - Theme provider
 * - Gesture handler root
 * - Safe area provider
 * - System UI configuration
 * - Splash screen management
 * - Error boundary
 */
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack, ErrorBoundary, router } from "expo-router";
import DeLauncherNativeModule from "@/modules/de-launcher-native/src/DeLauncherNativeModule";
export { ErrorBoundary };
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
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

// Set system background to transparent to show system wallpaper
// SystemUI.setBackgroundColorAsync("#000000");

function RootLayoutContent() {
  const { colors, isDark } = useTheme();
  const [error, setError] = useState<Error | null>(null);
  const {
    setInstalledApps,
    dockPackages,
    reorderDock,
    allowedPackages,
    setAllowedPackages,
  } = useAppStore();

  useEffect(() => {
    try {
      const subscription = DeLauncherNativeModule.addListener("onHomePressed", () => {
        // Pop/dismiss all navigation routes back to the root index screen "/"
        try {
          router.dismissAll();
        } catch (e) {
          // Ignore
        }
        try {
          router.replace("/");
        } catch (e) {
          console.warn("Failed to reset route to home index:", e);
        }
      });
      return () => {
        subscription.remove();
      };
    } catch (e) {
      console.warn("Failed to subscribe to onHomePressed event:", e);
    }
  }, []);

  useEffect(() => {
    async function loadApps() {
      try {
        const apps = await getInstalledApps();
        setInstalledApps(apps);

        // Set defaults on first run
        if (dockPackages.length === 0) {
          reorderDock(DEFAULT_DOCK_PACKAGES);
        }
        if (allowedPackages.length === 0) {
          setAllowedPackages(DEFAULT_ALLOWED_PACKAGES);
        }
      } catch (err) {
        console.error("[RootLayout] Error loading apps:", err);
        // Fallback: still try to set defaults even if app loading fails
        try {
          if (dockPackages.length === 0) {
            reorderDock(DEFAULT_DOCK_PACKAGES);
          }
          if (allowedPackages.length === 0) {
            setAllowedPackages(DEFAULT_ALLOWED_PACKAGES);
          }
        } catch (fallbackErr) {
          console.error("[RootLayout] Error setting defaults:", fallbackErr);
          setError(fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr)));
        }
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

  // Error fallback UI
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 16, textAlign: "center", marginBottom: 10 }}>
          App Error
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center" }}>
          {error.message}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
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

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 1500); // 1.5 second safety net

    return () => clearTimeout(timer);
  }, []);

  const shouldRender = fontsLoaded || fontError || timedOut;

  useEffect(() => {
    if (shouldRender) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "transparent" }}>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
