/**
 * Root Layout - De-Launcher
 *
 * Owns font loading, providers, native HOME events, and launcher bootstrap.
 */
import { useEffect, useState } from "react";
import { InteractionManager, AppState } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack, ErrorBoundary, router } from "expo-router";
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
  batchLoadMonochromeIcons,
  preloadIconPacks,
  resolveDefaultDockPackages,
  resolveDefaultAllowedPackages,
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

        // CRITICAL: If the user hasn't completed onboarding, never reset navigation to "/".
        // When De-Launcher is default launcher, returning from system settings fires CATEGORY_HOME.
        // Dismissing routes during onboarding would cancel transitions and trap the user on Welcome.
        const hasCompletedOnboarding = useSettingsStore.getState().hasCompletedOnboarding;
        if (!hasCompletedOnboarding) return;

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
        const hasCachedApps = currentState.installedApps.length > 0;

        // If we already have persisted apps from previous boot, show home screen instantly (0ms)
        if (hasCachedApps) {
          setIsReady(true);
        }

        const apps = await getInstalledApps();
        if (cancelled) return;

        // Resolve smart OEM defaults if dock or allowed apps are uninitialized
        if (currentState.dockPackages.length === 0) {
          const resolvedDock = resolveDefaultDockPackages(apps);
          reorderDock(resolvedDock);
          if (currentState.allowedPackages.length === 0) {
            setAllowedPackages(resolveDefaultAllowedPackages(apps, resolvedDock));
          }
        } else if (currentState.allowedPackages.length === 0) {
          setAllowedPackages(resolveDefaultAllowedPackages(apps, currentState.dockPackages));
        }

        // Only commit updates to store if there is an actual difference to prevent layout thrash
        const currentApps = currentState.installedApps;
        const hasDiff =
          currentApps.length !== apps.length ||
          apps.some(
            (a, i) =>
              !currentApps[i] ||
              currentApps[i].packageName !== a.packageName ||
              currentApps[i].icon !== a.icon ||
              currentApps[i].monoIcon !== a.monoIcon
          );

        if (hasDiff || !hasCachedApps) {
          setInstalledApps(apps);
        }

        // Preload visible icons in background
        const activeDock = useAppStore.getState().dockPackages;
        const activeAllowed = useAppStore.getState().allowedPackages;
        const visiblePackages = [...new Set([...activeDock, ...activeAllowed.slice(0, 20)])];
        batchLoadSystemIcons(visiblePackages).catch(() => {});
        if (useSettingsStore.getState().iconTheme === "monochrome") {
          batchLoadMonochromeIcons(visiblePackages).catch(() => {});
        }

        // Preload icon packs in background without blocking launcher UI
        backgroundTask = InteractionManager.runAfterInteractions(() => {
          preloadIconPacks().catch((iconPackError) =>
            console.warn("[RootLayout] Icon pack preload error:", iconPackError)
          );
        });

        setIsReady(true);
      } catch (loadError) {
        console.error("[RootLayout] Error loading apps:", loadError);
        setIsReady(true);
      }
    }

    loadApps();
    useAppStore.getState().pruneExemptions();

    return () => {
      cancelled = true;
      backgroundTask?.cancel();
    };
  }, [reorderDock, setAllowedPackages, setInstalledApps]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  if (!isReady) {
    return null; // Keep Splash screen visible during initial scan
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
            presentation: "transparentModal",
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="focus-settings"
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="dock-settings"
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="backup-settings"
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="theme-settings"
          options={{
            animation: "slide_from_right",
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
            animation: "slide_from_bottom",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            animation: "fade",
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
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const shouldRender = fontsLoaded || fontError || timedOut;

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
