import React from "react";
import { View, StyleSheet, Pressable, Modal, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ArrowLeft, ArrowRight, Trash, Plus, Minus, ShieldAlert } from "lucide-react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import { useAppStore } from "@/src/store/appStore";
import { AppInfo } from "@/src/types/app";

interface ContextMenuProps {
  selectedApp: AppInfo | null;
  onClose: () => void;
}

export function ContextMenu({ selectedApp, onClose }: ContextMenuProps) {
  const { colors } = useTheme();
  
  const moveApp = useAppStore((s) => s.moveApp);
  const moveDockApp = useAppStore((s) => s.moveDockApp);
  const setAppFocusState = useAppStore((s) => s.setAppFocusState);
  const addToDock = useAppStore((s) => s.addToDock);
  const removeFromDock = useAppStore((s) => s.removeFromDock);
  const dockPackages = useAppStore((s) => s.dockPackages) || [];
  const allowedPackages = useAppStore((s) => s.allowedPackages) || [];

  if (!selectedApp) return null;

  const isSelectedAppInDock = dockPackages.includes(selectedApp.packageName);
  const isSelectedAppInHome = allowedPackages.includes(selectedApp.packageName);

  return (
    <Modal
      visible={!!selectedApp}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
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
                    android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: false }}
                    onPress={() => {
                      moveDockApp(selectedApp.packageName, "left");
                      onClose();
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
                    android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: false }}
                    onPress={() => {
                      moveDockApp(selectedApp.packageName, "right");
                      onClose();
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
                  android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: false }}
                  onPress={() => {
                    removeFromDock(selectedApp.packageName);
                    onClose();
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
                    android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: false }}
                    onPress={() => {
                      setAppFocusState(selectedApp.packageName, "allowed");
                      onClose();
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
                    android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: false }}
                    onPress={() => {
                      moveApp(selectedApp.packageName, "left");
                      onClose();
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
                    android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: false }}
                    onPress={() => {
                      moveApp(selectedApp.packageName, "right");
                      onClose();
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
                    android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: false }}
                    onPress={() => {
                      addToDock(selectedApp.packageName);
                      onClose();
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
                  android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: false }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onClose();
                    setTimeout(() => {
                      setAppFocusState(selectedApp.packageName, "intent_pause");
                    }, 150);
                  }}
                >
                  <ShieldAlert size={18} color={colors.warning} />
                  <Text style={[styles.menuOptionText, { color: colors.warning }]}>
                    Require Intent Pause
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: 'rgba(239, 68, 68, 0.06)' }]}
                  android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: false }}
                  onPress={() => {
                    setAppFocusState(selectedApp.packageName, "blocked");
                    onClose();
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
              android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: false }}
              onPress={onClose}
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
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
  },
  menuAppSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    marginTop: 2,
  },
  menuOptions: {
    borderRadius: 20,
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
    fontFamily: typography.family.medium,
    fontSize: typography.size.md,
  },
  cancelOption: {
    marginTop: spacing.sm,
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
  },
});
