/**
 * Root Layout - De-Launcher
 *
 */
import { useEffect, useState } from "react";
import * as Sentry from "@sentry/react-native";
import { InteractionManager, View, Text, AppState } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack, ErrorBoundary, router, Redirect } from "expo-router";
import DeLauncherNativeModule from "@/modules/de-launcher-native/src/DeLauncherNativeModule";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
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
import { useSettingsStore } from "@/src/store/settingsStore";
import {
  getInstalledApps,
  batchLoadSystemIcons,
  preloadIconPacks,
  DEFAULT_DOCK_PACKAGES,
  DEFAULT_ALLOWED_PACKAGES,
} from "@/src/services/appManager";

export { ErrorBoundary };

SplashScreen.preventAutoHideAsync();

// Ignore a HOME event briefly while an intentional in-app transition runs.
let navigationGuardActive = false;
let navigationGuardTimer: ReturnType<typeof setTimeout> | null = null;

export function signalNavigation(durationMs = 600) {
  navigationGuardActive = true;
  if (navigationGuardTimer) clearTimeout(navigationGuardTimer);
  navigationGuardTimer = setTimeout(() => {
    navigationGuardActive = false;
    navigationGuardTimer = null;
  }, durationMs);
}

function RootLayoutContent() {
  const { colors, isDark } = useTheme();
  const [error, setError] = useState<Error | null>(null);
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);
  const setInstalledApps = useAppStore((s) => s.setInstalledApps);
  const reorderDock = useAppStore((s) => s.reorderDock);
  const setAllowedPackages = useAppStore((s) => s.setAllowedPackages);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        useAppStore.getState().pruneExemptions();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    try {
      const subscription = DeLauncherNativeModule.addListener("onHomePressed", () => {
        if (navigationGuardActive) return;

        try {
          router.dismissAll();
        } catch {
          // There may be no modal route to dismiss.
        }
        try {
          router.replace("/");
        } catch (eventError) {
          console.warn("Failed to reset route to home index:", eventError);
        }
      });
      return () => subscription.remove();
    } catch (eventError) {
      console.warn("Failed to subscribe to onHomePressed event:", eventError);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let backgroundTask: ReturnType<typeof InteractionManager.runAfterInteractions> | null = null;

    async function loadApps() {
      try {
        const currentState = useAppStore.getState();
        const initialDockPackages =
          currentState.dockPackages.length > 0
            ? currentState.dockPackages
            : DEFAULT_DOCK_PACKAGES;
        const initialAllowedPackages =
          currentState.allowedPackages.length > 0
            ? currentState.allowedPackages
            : DEFAULT_ALLOWED_PACKAGES;

        if (currentState.dockPackages.length === 0) {
          reorderDock(DEFAULT_DOCK_PACKAGES);
        }
        if (currentState.allowedPackages.length === 0) {
          setAllowedPackages(DEFAULT_ALLOWED_PACKAGES);
        }

        // Fetch only above-the-fold icons before mounting app tiles.
        const visiblePackages = [
          ...new Set([...initialDockPackages, ...initialAllowedPackages.slice(0, 20)]),
        ];
        const [apps] = await Promise.all([
          getInstalledApps(),
          batchLoadSystemIcons(visiblePackages),
        ]);
        if (cancelled) return;
        setInstalledApps(apps);

        // Discovery is useful for Settings, but should not delay launcher paint.
        backgroundTask = InteractionManager.runAfterInteractions(() => {
          preloadIconPacks().catch((iconPackError) =>
            console.warn("[RootLayout] Icon pack preload error:", iconPackError)
          );
        });
      } catch (loadError) {
        console.error("[RootLayout] Error loading apps:", loadError);
        try {
          const currentState = useAppStore.getState();
          if (currentState.dockPackages.length === 0) {
            reorderDock(DEFAULT_DOCK_PACKAGES);
          }
          if (currentState.allowedPackages.length === 0) {
            setAllowedPackages(DEFAULT_ALLOWED_PACKAGES);
          }
        } catch (fallbackError) {
          console.error("[RootLayout] Error setting defaults:", fallbackError);
          setError(
            fallbackError instanceof Error
              ? fallbackError
              : new Error(String(fallbackError))
          );
        }
      }
    }

    loadApps();
    useAppStore.getState().pruneExemptions();
    setIsReady(true);

    return () => {
      cancelled = true;
      backgroundTask?.cancel();
    };
  }, [reorderDock, setAllowedPackages, setInstalledApps]);

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

  if (!hasCompletedOnboarding || !isReady) {
    return <Redirect href={"/onboarding" as any} />;
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
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="dock-settings"
          options={{
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            animation: "fade",
            presentation: "transparentModal",
          }}
        />
        <Stack.Screen
          name="intent-pause"
          options={{
            animation: "fade",
            presentation: "transparentModal",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

function RootLayout() {
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
    }, 1500);

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

Sentry.init({
  dsn: 'https://a3ca8710e0fdb7eddee48cf5d070a6f3@o4510973886464000.ingest.de.sentry.io/4511468726255696',
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,
});

export default Sentry.wrap(RootLayout);
