/**
 * ContextMenu Component — De-Launcher
 *
 * Bottom sheet options for any app (from Home, Dock, or Drawer).
 * Features:
 * - Direct Intentional Pinning Checkpoint (requires reason >= 10 chars)
 * - Move left/right in Home & Dock
 * - Focus scheduling & folder categorization
 * - Require intent pause & remove from home
 */
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Text,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
              ToastAndroid,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  ArrowRight,
  Trash,
  Plus,
  Minus,
  ShieldAlert,
  Clock,
  FolderPlus,
  Briefcase,
  Moon,
  Sparkles,
  ShieldCheck,
} from "lucide-react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import { useAppStore } from "@/src/store/appStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { AppInfo, ScheduleType } from "@/src/types/app";

const INSPIRATION_CHIPS = [
  "Work Communication",
  "Daily Habit & Fitness",
  "Essential Navigation",
  "Creative Production",
  "Financial Management",
];

const MIN_REASON_LENGTH = 10;

interface ContextMenuProps {
  selectedApp: AppInfo | null;
  onClose: () => void;
}

export function ContextMenu({ selectedApp, onClose }: ContextMenuProps) {
  const { colors, isDark } = useTheme();
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  const moveApp = useAppStore((s) => s.moveApp);
  const moveDockApp = useAppStore((s) => s.moveDockApp);
  const setAppFocusState = useAppStore((s) => s.setAppFocusState);
  const removeFromDock = useAppStore((s) => s.removeFromDock);
  const folders = useAppStore((s) => s.folders) || [];
  const createFolder = useAppStore((s) => s.createFolder);
  const addAppToFolder = useAppStore((s) => s.addAppToFolder);
  const setAppScheduleRule = useAppStore((s) => s.setAppScheduleRule);
  const scheduleRules = useAppStore((s) => s.scheduleRules) || {};
  const appReasons = useAppStore((s) => s.appReasons) || {};
  const pinAppWithReason = useAppStore((s) => s.pinAppWithReason);

  const dockPackages = useAppStore((s) => s.dockPackages) || [];
  const allowedPackages = useAppStore((s) => s.allowedPackages) || [];
  const maxDockIcons = useSettingsStore((s) => s.maxDockIcons);

  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showPinCheckpoint, setShowPinCheckpoint] = useState(false);
  const [pinTarget, setPinTarget] = useState<"home" | "dock">("home");
  const [pinReason, setPinReason] = useState("");

  useEffect(() => {
    if (selectedApp) {
      setPinReason(appReasons[selectedApp.packageName] || "");
      setShowFolderPicker(false);
      setShowSchedulePicker(false);
      setShowPinCheckpoint(false);
    }
  }, [selectedApp, appReasons]);

  if (!selectedApp) return null;

  const isSelectedAppInDock = dockPackages.includes(selectedApp.packageName);
  const isSelectedAppInHome = allowedPackages.includes(selectedApp.packageName);
  const currentRule = scheduleRules[selectedApp.packageName]?.scheduleType || "always_allowed";

  const handleScheduleSelect = (type: ScheduleType) => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppScheduleRule({
      packageName: selectedApp.packageName,
      scheduleType: type,
    });
    setShowSchedulePicker(false);
    onClose();
  };

  const handleAddToExistingFolder = (folderId: string) => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addAppToFolder(folderId, selectedApp.packageName);
    setShowFolderPicker(false);
    onClose();
  };

  const handleCreateNewFolder = () => {
    if (!newFolderName.trim()) return;
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createFolder(newFolderName.trim(), [selectedApp.packageName]);
    setNewFolderName("");
    setShowFolderPicker(false);
    onClose();
  };

  const isReasonValid = pinReason.trim().length >= MIN_REASON_LENGTH;

  const handleConfirmPin = () => {
    if (!isReasonValid) {
      if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    pinAppWithReason(selectedApp.packageName, pinReason.trim(), pinTarget);
    if (Platform.OS === "android") {
      ToastAndroid.show(`📌 Pinned ${selectedApp.label} to ${targetLabel}`, ToastAndroid.SHORT);
    }
    setShowPinCheckpoint(false);
    onClose();
  };

  const handleChipPress = (chipText: string) => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPinReason((prev) => (prev ? `${prev} — ${chipText}` : chipText));
  };

  const targetLabel = pinTarget === "home" ? "Home Screen" : "Dock";

  return (
    <Modal
      visible={!!selectedApp}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          entering={FadeInDown.duration(150)}
          style={[styles.menuContainer, { backgroundColor: isDark ? "#161616" : "#FFFFFF" }]}
        >
          {/* App Title inside Menu */}
          <View style={styles.menuHeader}>
            <Text style={[styles.menuAppTitle, { color: colors.textPrimary }]}>
              {selectedApp.label}
            </Text>
            <Text style={[styles.menuAppSubtitle, { color: colors.textTertiary }]}>
              {selectedApp.packageName}
            </Text>
            {appReasons[selectedApp.packageName] && !showPinCheckpoint && (
              <View style={[styles.reasonBadge, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}>
                <Text style={[styles.reasonBadgeText, { color: colors.accent }]} numberOfLines={2}>
                  📌 Pinned for: {appReasons[selectedApp.packageName]}
                </Text>
              </View>
            )}
          </View>

          {/* Sub-view: Intentional Pinning Checkpoint */}
          {showPinCheckpoint ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.pinCheckpointContainer}
            >
              <View style={[styles.checkpointBanner, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}>
                <ShieldCheck size={16} color={colors.accent} />
                <Text style={[styles.checkpointBannerText, { color: colors.accent }]}>
                  Intentional Pinning Checkpoint ({targetLabel})
                </Text>
              </View>

              <Text style={[styles.pinPromptText, { color: colors.textPrimary }]}>
                Why does this app deserve prime real estate on your {targetLabel}?
              </Text>

              {/* Inspiration Chips */}
              <View style={styles.chipRow}>
                {INSPIRATION_CHIPS.map((chip, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleChipPress(chip)}
                    style={[styles.chip, { backgroundColor: isDark ? "#242424" : "#F1F5F9", borderColor: colors.border }]}
                  >
                    <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                      + {chip}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Reason Input */}
              <View style={[styles.reasonInputContainer, { backgroundColor: isDark ? "#101010" : "#F8FAFC", borderColor: isReasonValid ? colors.accent : colors.border }]}>
                <TextInput
                  placeholder="e.g., Only for client updates during work hours..."
                  placeholderTextColor={colors.textTertiary}
                  value={pinReason}
                  onChangeText={setPinReason}
                  multiline
                  numberOfLines={2}
                  style={[styles.reasonInput, { color: colors.textPrimary }]}
                  contextMenuHidden={true}
                  returnKeyType="done"
                  onSubmitEditing={handleConfirmPin}
                />
              </View>

              {/* Validation Row */}
              <View style={styles.validationRow}>
                <Text style={[styles.charCountText, { color: isReasonValid ? colors.accent : colors.textTertiary }]}>
                  {pinReason.trim().length} / {MIN_REASON_LENGTH} characters minimum
                </Text>
              </View>

              {/* Confirm / Cancel Buttons */}
              <View style={styles.pinActionRow}>
                <Pressable
                  onPress={() => setShowPinCheckpoint(false)}
                  style={[styles.pinCancelBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.pinCancelText, { color: colors.textSecondary }]}>Back</Text>
                </Pressable>

                <Pressable
                  onPress={handleConfirmPin}
                  disabled={!isReasonValid}
                  style={[
                    styles.pinConfirmBtn,
                    {
                      backgroundColor: isReasonValid ? colors.accent : (isDark ? "#282828" : "#E2E8F0"),
                      opacity: isReasonValid ? 1 : 0.6,
                    },
                  ]}
                >
                  <Sparkles size={14} color={isReasonValid ? "#FFFFFF" : colors.textTertiary} />
                  <Text style={[styles.pinConfirmText, { color: isReasonValid ? "#FFFFFF" : colors.textTertiary }]}>
                    Pin to {targetLabel}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : showSchedulePicker ? (
            /* Sub-view: Schedule Picker */
            <View style={styles.menuOptions}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                Select Allowed Hours
              </Text>
              <Pressable
                style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                onPress={() => handleScheduleSelect("always_allowed")}
              >
                <Clock size={18} color={currentRule === "always_allowed" ? colors.accent : colors.textPrimary} />
                <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                  Always Allowed (24/7)
                </Text>
              </Pressable>
              <Pressable
                style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                onPress={() => handleScheduleSelect("work_hours")}
              >
                <Briefcase size={18} color={currentRule === "work_hours" ? colors.accent : colors.textPrimary} />
                <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                  Work Hours Only (9:00 AM – 5:00 PM Mon–Fri)
                </Text>
              </Pressable>
              <Pressable
                style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                onPress={() => handleScheduleSelect("evening_only")}
              >
                <Moon size={18} color={currentRule === "evening_only" ? colors.accent : colors.textPrimary} />
                <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                  Evening Only (6:00 PM – 10:00 PM)
                </Text>
              </Pressable>
              <Pressable
                style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                onPress={() => handleScheduleSelect("blocked")}
              >
                <Trash size={18} color={colors.error} />
                <Text style={[styles.menuOptionText, { color: colors.error }]}>
                  Strictly Blocked
                </Text>
              </Pressable>
              <Pressable
                style={[styles.menuOption, styles.cancelOption]}
                onPress={() => setShowSchedulePicker(false)}
              >
                <Text style={[styles.menuOptionText, { color: colors.textTertiary, textAlign: "center", width: "100%" }]}>
                  Back
                </Text>
              </Pressable>
            </View>
          ) : showFolderPicker ? (
            /* Sub-view: Folder Picker */
            <View style={styles.menuOptions}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                Add to Folder
              </Text>
              {folders.map((folder) => (
                <Pressable
                  key={folder.id}
                  style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  onPress={() => handleAddToExistingFolder(folder.id)}
                >
                  <FolderPlus size={18} color={colors.textPrimary} />
                  <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                    {folder.name} ({folder.packageNames.length} apps)
                  </Text>
                </Pressable>
              ))}

              {/* Create new folder input */}
              <View style={[styles.newFolderRow, { borderColor: colors.border }]}>
                <TextInput
                  placeholder="New folder name..."
                  placeholderTextColor={colors.textTertiary}
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  style={[styles.folderInput, { color: colors.textPrimary }]}
                />
                <Pressable
                  onPress={handleCreateNewFolder}
                  style={[styles.createFolderBtn, { backgroundColor: colors.accent }]}
                >
                  <Text style={[styles.createFolderText, { color: "#FFFFFF" }]}>Create</Text>
                </Pressable>
              </View>

              <Pressable
                style={[styles.menuOption, styles.cancelOption]}
                onPress={() => setShowFolderPicker(false)}
              >
                <Text style={[styles.menuOptionText, { color: colors.textTertiary, textAlign: "center", width: "100%" }]}>
                  Back
                </Text>
              </Pressable>
            </View>
          ) : (
            /* Main Actions List */
            <ScrollView style={styles.menuOptions} showsVerticalScrollIndicator={false}>
              {/* Schedule Allowed Time */}
              <Pressable
                style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                onPress={() => setShowSchedulePicker(true)}
              >
                <Clock size={18} color={colors.textPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                    Focus Schedule
                  </Text>
                  <Text style={[styles.subLabel, { color: colors.textTertiary }]}>
                    {currentRule === "work_hours"
                      ? "Work hours only"
                      : currentRule === "evening_only"
                      ? "Evening only"
                      : currentRule === "blocked"
                      ? "Strictly blocked"
                      : "Always allowed"}
                  </Text>
                </View>
              </Pressable>

              {/* Add to Folder */}
              <Pressable
                style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                onPress={() => setShowFolderPicker(true)}
              >
                <FolderPlus size={18} color={colors.textPrimary} />
                <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                  Organize into Folder
                </Text>
              </Pressable>

              {/* Dock Actions */}
              {isSelectedAppInDock && (
                <>
                  {dockPackages.indexOf(selectedApp.packageName) > 0 && (
                    <Pressable
                      style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
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

                  {!isSelectedAppInDock && dockPackages.length < maxDockIcons && (
                    <Pressable
                      style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                      onPress={() => {
                        setPinTarget("dock");
                        setShowPinCheckpoint(true);
                      }}
                    >
                      <Plus size={18} color={colors.textPrimary} />
                      <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                        Add to Dock (Requires Reason)
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                    onPress={() => {
                      if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                    style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: "rgba(239, 68, 68, 0.06)" }]}
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

              {!isSelectedAppInHome && (
                <Pressable
                  style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  onPress={() => {
                    setPinTarget("home");
                    setShowPinCheckpoint(true);
                  }}
                >
                  <Plus size={18} color={colors.textPrimary} />
                  <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>
                    Add to Home Screen (Requires Reason)
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.menuOption, styles.cancelOption]}
                onPress={onClose}
              >
                <Text style={[styles.menuOptionText, { color: colors.textTertiary, textAlign: "center", width: "100%" }]}>
                  Cancel
                </Text>
              </Pressable>
            </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  menuContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing["3xl"],
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    maxHeight: 560,
  },
  menuHeader: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  menuAppTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
  },
  menuAppSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  reasonBadge: {
    marginTop: spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: "100%",
  },
  reasonBadgeText: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    lineHeight: 15,
  },
  sectionTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  menuOptions: {
    borderRadius: 18,
    overflow: "hidden",
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    minHeight: 48,
  },
  menuOptionText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
  },
  subLabel: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    marginTop: 2,
  },
  newFolderRow: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: spacing.sm,
    alignItems: "center",
  },
  folderInput: {
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    paddingHorizontal: spacing.xs,
  },
  createFolderBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createFolderText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
  },
  cancelOption: {
    marginTop: spacing.sm,
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
  },
  pinCheckpointContainer: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  checkpointBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkpointBannerText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
  },
  pinPromptText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginVertical: 4,
  },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: typography.family.medium,
    fontSize: 11,
  },
  reasonInputContainer: {
    borderRadius: 14,
    borderWidth: 1.2,
    padding: spacing.sm + 2,
    minHeight: 64,
  },
  reasonInput: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    padding: 0,
    textAlignVertical: "top",
  },
  validationRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  charCountText: {
    fontFamily: typography.family.medium,
    fontSize: 11,
  },
  pinActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  pinCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pinCancelText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
  },
  pinConfirmBtn: {
    flex: 2,
    height: 42,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  pinConfirmText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
  },
});
