import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Text,
  ScrollView,
  TextInput,
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
} from "lucide-react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import { useAppStore } from "@/src/store/appStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { AppInfo, ScheduleType } from "@/src/types/app";
import { IntentionalPinModal } from "./IntentionalPinModal";

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
  const folders = useAppStore((s) => s.folders) || [];
  const createFolder = useAppStore((s) => s.createFolder);
  const addAppToFolder = useAppStore((s) => s.addAppToFolder);
  const setAppScheduleRule = useAppStore((s) => s.setAppScheduleRule);
  const scheduleRules = useAppStore((s) => s.scheduleRules) || {};
  const appReasons = useAppStore((s) => s.appReasons) || {};

  const dockPackages = useAppStore((s) => s.dockPackages) || [];
  const allowedPackages = useAppStore((s) => s.allowedPackages) || [];
  const maxDockIcons = useSettingsStore((s) => s.maxDockIcons);

  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinTarget, setPinTarget] = useState<"home" | "dock">("home");

  if (!selectedApp) return null;

  const isSelectedAppInDock = dockPackages.includes(selectedApp.packageName);
  const isSelectedAppInHome = allowedPackages.includes(selectedApp.packageName);
  const currentRule = scheduleRules[selectedApp.packageName]?.scheduleType || "always_allowed";

  const handleScheduleSelect = (type: ScheduleType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppScheduleRule({
      packageName: selectedApp.packageName,
      scheduleType: type,
    });
    setShowSchedulePicker(false);
    onClose();
  };

  const handleAddToExistingFolder = (folderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addAppToFolder(folderId, selectedApp.packageName);
    setShowFolderPicker(false);
    onClose();
  };

  const handleCreateNewFolder = () => {
    if (!newFolderName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createFolder(newFolderName.trim(), [selectedApp.packageName]);
    setNewFolderName("");
    setShowFolderPicker(false);
    onClose();
  };

  return (
    <Modal
      visible={!!selectedApp}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          entering={FadeInDown.duration(150)}
          style={[styles.menuContainer, { backgroundColor: colors.surface }]}
        >
          {/* App Title inside Menu */}
          <View style={styles.menuHeader}>
            <Text style={[styles.menuAppTitle, { color: colors.textPrimary }]}>
              {selectedApp.label}
            </Text>
            <Text style={[styles.menuAppSubtitle, { color: colors.textTertiary }]}>
              {selectedApp.packageName}
            </Text>
            {appReasons[selectedApp.packageName] && (
              <View style={[styles.reasonBadge, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}>
                <Text style={[styles.reasonBadgeText, { color: colors.accent }]} numberOfLines={2}>
                  📌 Pinned for: {appReasons[selectedApp.packageName]}
                </Text>
              </View>
            )}
          </View>

          {/* Sub-view: Schedule Picker */}
          {showSchedulePicker ? (
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
                  <Text style={[styles.createFolderText, { color: "#0A0A0A" }]}>Create</Text>
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
                        setShowPinModal(true);
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
                    setShowPinModal(true);
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
      </Pressable>

      {/* Intentional Pinning Checkpoint Modal */}
      <IntentionalPinModal
        app={showPinModal ? selectedApp : null}
        target={pinTarget}
        onClose={() => {
          setShowPinModal(false);
          onClose();
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing["3xl"],
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    maxHeight: 520,
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
});
