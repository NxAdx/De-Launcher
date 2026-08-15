/**
 * FolderModal Component
 *
 * Smooth modal overlay displaying apps within a folder.
 * Supports launching apps, renaming the folder, and removing apps.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { X, Edit2, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import { FolderInfo, AppInfo } from "@/src/types/app";
import { useAppStore } from "@/src/store/appStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { AppIcon } from "./AppIcon";
import { launchApp } from "@/src/services/appManager";

interface FolderModalProps {
  folder: FolderInfo | null;
  onClose: () => void;
}

export function FolderModal({ folder, onClose }: FolderModalProps) {
  const { colors, isDark } = useTheme();
  const installedApps = useAppStore((s) => s.installedApps);
  const updateFolder = useAppStore((s) => s.updateFolder);
  const deleteFolder = useAppStore((s) => s.deleteFolder);
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  const [isEditingName, setIsEditingName] = useState(false);
  const [folderName, setFolderName] = useState(folder?.name || "");

  if (!folder) return null;

  const folderApps = folder.packageNames
    .map((pkg) => installedApps.find((a) => a.packageName === pkg))
    .filter((a): a is AppInfo => !!a);

  const handleAppPress = (app: AppInfo) => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => {
      launchApp(app.packageName);
    }, 150);
  };

  const handleSaveName = () => {
    const trimmed = folderName.trim();
    if (trimmed && trimmed !== folder.name) {
      updateFolder(folder.id, { name: trimmed });
    }
    setIsEditingName(false);
  };

  const handleDeleteFolder = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteFolder(folder.id);
    onClose();
  };

  return (
    <Modal
      visible={!!folder}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurView
          intensity={isDark ? 80 : 50}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />

        <Pressable
          style={[styles.modalCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            {isEditingName ? (
              <TextInput
                value={folderName}
                onChangeText={setFolderName}
                onBlur={handleSaveName}
                onSubmitEditing={handleSaveName}
                autoFocus
                style={[styles.nameInput, { color: colors.textPrimary, borderColor: colors.accent }]}
              />
            ) : (
              <Pressable
                onPress={() => {
                  setFolderName(folder.name);
                  setIsEditingName(true);
                }}
                style={styles.nameContainer}
              >
                <Text style={[styles.folderTitle, { color: colors.textPrimary }]}>
                  {folder.name}
                </Text>
                <Edit2 size={14} color={colors.textTertiary} />
              </Pressable>
            )}

            <View style={styles.headerActions}>
              <Pressable onPress={handleDeleteFolder} hitSlop={8} style={styles.actionBtn}>
                <Trash2 size={16} color={colors.error} />
              </Pressable>
              <Pressable onPress={onClose} hitSlop={8} style={styles.actionBtn}>
                <X size={20} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          {/* Apps Grid */}
          <ScrollView
            contentContainerStyle={styles.appsGrid}
            showsVerticalScrollIndicator={false}
          >
            {folderApps.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                No apps in this folder. Add apps via the app drawer.
              </Text>
            ) : (
              folderApps.map((app) => (
                <View key={app.packageName} style={styles.appWrapper}>
                  <AppIcon
                    app={app}
                    onPress={handleAppPress}
                    showLabel={true}
                  />
                </View>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    maxHeight: 460,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  folderTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
  },
  nameInput: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    borderBottomWidth: 1.5,
    paddingVertical: 2,
    flex: 1,
    marginRight: spacing.sm,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionBtn: {
    padding: 6,
  },
  appsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  appWrapper: {
    width: "30%",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    textAlign: "center",
    paddingVertical: spacing.xl,
    width: "100%",
  },
});
