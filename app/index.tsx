/**
 * Homescreen — De-Launcher
 *
 * The main launcher screen. Features:
 * - Large minimal clock
 * - Grid of allowed (whitelisted) apps only
 * - Dock at the bottom
 * - Swipe up to open app drawer
 */
import React, { useCallback, useState } from "react";
import { View, StyleSheet, Pressable, Modal, Text, StatusBar as RNStatusBar } from "react-native";
import Animated, { FadeIn, FadeInUp, FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { Settings, ArrowLeft, ArrowRight, Trash, Plus, Minus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { spacing, layout } from "@/src/theme/tokens";
import { Clock } from "@/src/components/Clock";
import { AppGrid } from "@/src/components/AppGrid";
import { Dock } from "@/src/components/Dock";
import { useAppStore } from "@/src/store/appStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { launchApp, prefetchIcon, prefetchSystemIcon } from "@/src/services/appManager";
import { AppInfo } from "@/src/types/app";

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const statusBarHeight = RNStatusBar.currentHeight ?? insets.top ?? 24;
  const showClock = useSettingsStore((s) => s.showClock);
  const installedApps = useAppStore((s) => s.installedApps);
  const allowedPackages = useAppStore((s) => s.allowedPackages);
  const moveApp = useAppStore((s) => s.moveApp);
  const moveDockApp = useAppStore((s) => s.moveDockApp);
  const toggleAppAllowed = useAppStore((s) => s.toggleAppAllowed);
  const dockPackages = useAppStore((s) => s.dockPackages);
  const addToDock = useAppStore((s) => s.addToDock);
  const removeFromDock = useAppStore((s) => s.removeFromDock);
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);

  const allowedApps = React.useMemo(() => {
    const appsMap = new Map(installedApps.map((app) => [app.packageName, app]));
    return allowedPackages
      .map((pkg) => appsMap.get(pkg))
      .filter((app): app is AppInfo => !!app);
  }, [installedApps, allowedPackages]);

  const handleAppPress = useCallback((app: AppInfo) => {
    launchApp(app.packageName);
  }, []);

  const handleAppLongPress = useCallback((app: AppInfo) => {
    setSelectedApp(app);
  }, []);

  // Background preloader for icons to guarantee synchronous zero-flicker mounts
  const activeIconPack = useSettingsStore((s) => s.activeIconPack);
  React.useEffect(() => {
    const preload = async () => {
      const allPkgs = Array.from(new Set([...allowedPackages, ...dockPackages]));
      for (const pkg of allPkgs) {
        if (activeIconPack) {
          prefetchIcon(activeIconPack, pkg);
        }
        prefetchSystemIcon(pkg);
      }
    };
    preload();
  }, [activeIconPack, allowedPackages, dockPackages]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Settings gear */}
        <Animated.View
          entering={FadeIn.delay(400)}
          style={[styles.settingsButton, { top: statusBarHeight + spacing.sm }]}
        >
          <Pressable
            onPress={() => router.push("/settings")}
            hitSlop={16}
            style={styles.settingsPressable}
          >
            <Settings size={20} color={colors.textTertiary} />
          </Pressable>
        </Animated.View>

        {/* Clock */}
        {showClock && (
          <View style={{ paddingTop: statusBarHeight }}>
            <Clock />
          </View>
        )}

        {/* App Grid — only allowed apps */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(300)}
          style={[
            styles.gridContainer,
            !showClock && { paddingTop: statusBarHeight + 80 },
          ]}
        >
          <AppGrid
            apps={allowedApps}
            onPress={handleAppPress}
            onLongPress={handleAppLongPress}
          />
        </Animated.View>

        {/* Dock */}
        <Dock onLongPress={handleAppLongPress} />

        {/* Long Press Context Menu */}
        {selectedApp && (() => {
          const isSelectedAppInDock = dockPackages.includes(selectedApp.packageName);
          const isSelectedAppInHome = allowedPackages.includes(selectedApp.packageName);
          return (
            <Modal
              visible={!!selectedApp}
              transparent
              animationType="fade"
              statusBarTranslucent
              onRequestClose={() => setSelectedApp(null)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setSelectedApp(null)}>
                <Animated.View entering={FadeInDown.duration(250)} style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
                  {/* App Title inside Menu */}
                  <View style={styles.menuHeader}>
                    <Text style={[styles.menuAppTitle, { color: colors.textPrimary }]}>
                      {selectedApp.label}
                    </Text>
                    <Text style={[styles.menuAppSubtitle, { color: colors.textTertiary }]}>
                      {selectedApp.packageName}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.menuOptions}>
                    {/* Dock Actions */}
                    {isSelectedAppInDock && (
                      <>
                        {dockPackages.indexOf(selectedApp.packageName) > 0 && (
                          <Pressable
                            style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                            onPress={() => {
                              moveDockApp(selectedApp.packageName, "left");
                              setSelectedApp(null);
                            }}
                          >
                            <ArrowLeft size={18} color={colors.textPrimary} />
                            <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                              Move Left in Dock
                            </Text>
                          </Pressable>
                        )}

                        {dockPackages.indexOf(selectedApp.packageName) < dockPackages.length - 1 && (
                          <Pressable
                            style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                            onPress={() => {
                              moveDockApp(selectedApp.packageName, "right");
                              setSelectedApp(null);
                            }}
                          >
                            <ArrowRight size={18} color={colors.textPrimary} />
                            <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                              Move Right in Dock
                            </Text>
                          </Pressable>
                        )}

                        <Pressable
                          style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                          onPress={() => {
                            removeFromDock(selectedApp.packageName);
                            setSelectedApp(null);
                          }}
                        >
                          <Minus size={18} color={colors.textPrimary} />
                          <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                            Remove from Dock
                          </Text>
                        </Pressable>

                        {!isSelectedAppInHome && (
                          <Pressable
                            style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                            onPress={() => {
                              toggleAppAllowed(selectedApp.packageName);
                              setSelectedApp(null);
                            }}
                          >
                            <Plus size={18} color={colors.textPrimary} />
                            <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                              Add to Home Screen
                            </Text>
                          </Pressable>
                        )}
                      </>
                    )}

                    {/* Homescreen Actions */}
                    {isSelectedAppInHome && (
                      <>
                        {allowedPackages.indexOf(selectedApp.packageName) > 0 && (
                          <Pressable
                            style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                            onPress={() => {
                              moveApp(selectedApp.packageName, "left");
                              setSelectedApp(null);
                            }}
                          >
                            <ArrowLeft size={18} color={colors.textPrimary} />
                            <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                              Move Left on Home
                            </Text>
                          </Pressable>
                        )}

                        {allowedPackages.indexOf(selectedApp.packageName) < allowedPackages.length - 1 && (
                          <Pressable
                            style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                            onPress={() => {
                              moveApp(selectedApp.packageName, "right");
                              setSelectedApp(null);
                            }}
                          >
                            <ArrowRight size={18} color={colors.textPrimary} />
                            <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                              Move Right on Home
                            </Text>
                          </Pressable>
                        )}

                        {!isSelectedAppInDock && dockPackages.length < 5 && (
                          <Pressable
                            style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                            onPress={() => {
                              addToDock(selectedApp.packageName);
                              setSelectedApp(null);
                            }}
                          >
                            <Plus size={18} color={colors.textPrimary} />
                            <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                              Add to Dock
                            </Text>
                          </Pressable>
                        )}

                        <Pressable
                          style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                          onPress={() => {
                            toggleAppAllowed(selectedApp.packageName);
                            setSelectedApp(null);
                          }}
                        >
                          <Trash size={18} color={colors.error} />
                          <Text style={[styles.menuOptionText, { color: colors.error }]}>
                            Remove from Home
                        </Text>
                        </Pressable>
                      </>
                    )}

                    <Pressable
                      style={[styles.menuOption, styles.cancelOption]}
                      onPress={() => setSelectedApp(null)}
                    >
                      <Text style={[styles.menuOptionText, { color: colors.textTertiary, textAlign: "center", width: "100%" }]}>
                        Cancel
                      </Text>
                    </Pressable>
                  </View>
                </Animated.View>
              </Pressable>
            </Modal>
          );
        })()}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsButton: {
    position: "absolute",
    right: spacing.xl,
    zIndex: 10,
  },
  settingsPressable: {
    padding: spacing.sm,
    borderRadius: 999,
  },
  gridContainer: {
    flex: 1,
    marginBottom: layout.dockHeight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing["3xl"],
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  menuHeader: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  menuAppTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  menuAppSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  menuOptions: {
    borderRadius: 16,
    overflow: "hidden",
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    gap: spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  menuOptionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  cancelOption: {
    marginTop: spacing.sm,
    justifyContent: "center",
    backgroundColor: "transparent",
  },
});
