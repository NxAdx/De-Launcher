/**
 * IntentionalPinModal Component
 *
 * Psychological friction checkpoint when adding an app to Home or Dock.
 * Compels the user to articulate why the app deserves prime real estate on their device.
 * Enforces mindful typing by disabling copy-paste shortcuts.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Sparkles, ShieldCheck, X } from "lucide-react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing, radii } from "@/src/theme/tokens";
import { AppIcon } from "./AppIcon";
import { AppInfo } from "@/src/types/app";
import { useAppStore } from "@/src/store/appStore";
import { useSettingsStore } from "@/src/store/settingsStore";

const INSPIRATION_CHIPS = [
  "Work & Team Communication",
  "Daily Habit & Fitness",
  "Essential Utility / Navigation",
  "Creative Production",
  "Financial Management",
];

const MIN_REASON_LENGTH = 10;

interface IntentionalPinModalProps {
  app: AppInfo | null;
  target?: "home" | "dock";
  onClose: () => void;
  onSuccess?: () => void;
}

export function IntentionalPinModal({
  app,
  target = "home",
  onClose,
  onSuccess,
}: IntentionalPinModalProps) {
  const { colors, isDark } = useTheme();
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);
  const pinAppWithReason = useAppStore((s) => s.pinAppWithReason);
  const appReasons = useAppStore((s) => s.appReasons) || {};

  const [reason, setReason] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (app) {
      // Pre-fill existing reason if one was saved before
      setReason(appReasons[app.packageName] || "");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    } else {
      setReason("");
    }
  }, [app, appReasons]);

  if (!app) return null;

  const isLengthValid = reason.trim().length >= MIN_REASON_LENGTH;

  const handleChipPress = (chipText: string) => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReason((prev) => (prev ? `${prev} — ${chipText}` : chipText));
  };

  const handleConfirm = () => {
    if (!isLengthValid) {
      if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pinAppWithReason(app.packageName, reason.trim(), target);
    onSuccess?.();
    onClose();
  };

  const handleCancel = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const targetLabel = target === "home" ? "Home Screen" : "Dock";

  return (
    <Modal
      visible={!!app}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={handleCancel} />

        <Animated.View
          entering={FadeInDown.duration(250)}
          style={[
            styles.cardContainer,
            {
              backgroundColor: isDark
                ? "rgba(22, 22, 22, 0.96)"
                : "rgba(252, 252, 252, 0.98)",
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View style={styles.appHeaderGroup}>
              <AppIcon app={app} size={40} showLabel={false} onPress={() => {}} />
              <View style={styles.titleGroup}>
                <View style={styles.badgeRow}>
                  <Text style={[styles.appName, { color: colors.textPrimary }]}>
                    {app.label}
                  </Text>
                  <View style={[styles.curateBadge, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}>
                    <ShieldCheck size={11} color={colors.accent} />
                    <Text style={[styles.curateBadgeText, { color: colors.accent }]}>
                      Curating {targetLabel}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.packageText, { color: colors.textTertiary }]}>
                  {app.packageName}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleCancel}
              hitSlop={12}
              style={[styles.closeButton, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}
            >
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Question / Prompt */}
          <View style={styles.promptSection}>
            <Text style={[styles.promptTitle, { color: colors.textPrimary }]}>
              Why does this app belong on your {targetLabel}?
            </Text>
            <Text style={[styles.promptSubtitle, { color: colors.textSecondary }]}>
              Your home is reserved for intentional tools that serve your life, not habits that consume it.
            </Text>
          </View>

          {/* Reason Input (Anti Copy-Paste Protected) */}
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g., Essential daily calendar for scheduling meetings..."
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={140}
              contextMenuHidden={true} // Disables copy-paste menu for intentional typing
              style={[
                styles.reasonInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.04)",
                  borderColor: isLengthValid ? colors.accent : colors.cardBorder,
                },
              ]}
            />
            <View style={styles.charCounterRow}>
              <Text
                style={[
                  styles.charCounterText,
                  {
                    color: isLengthValid ? colors.accent : colors.textTertiary,
                  },
                ]}
              >
                {reason.trim().length} / {MIN_REASON_LENGTH} min characters
              </Text>
              <Text style={[styles.antiPasteHint, { color: colors.textTertiary }]}>
                Mindful typing enforced
              </Text>
            </View>
          </View>

          {/* Inspiration Chips */}
          <View style={styles.chipsSection}>
            <View style={styles.chipsLabelRow}>
              <Sparkles size={12} color={colors.accentTint} />
              <Text style={[styles.chipsSectionLabel, { color: colors.accentTint }]}>
                Quick Categories & Intentions
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScrollContent}
            >
              {INSPIRATION_CHIPS.map((chip, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleChipPress(chip)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.06)"
                        : "rgba(0, 0, 0, 0.05)",
                      borderColor: colors.cardBorder,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                    {chip}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleCancel}
              style={[
                styles.cancelButton,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.04)"
                    : "rgba(0, 0, 0, 0.03)",
                },
              ]}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                Keep in Drawer Only
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              disabled={!isLengthValid}
              style={[
                styles.confirmButton,
                {
                  backgroundColor: isLengthValid ? colors.accent : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"),
                  borderColor: isLengthValid ? colors.accent : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  {
                    color: isLengthValid ? "#FFFFFF" : colors.textTertiary,
                  },
                ]}
              >
                Pin to {targetLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  cardContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1.2,
    padding: spacing.xl,
    zIndex: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  appHeaderGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  titleGroup: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  appName: {
    fontFamily: typography.family.bold,
    fontSize: 16,
  },
  curateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  curateBadgeText: {
    fontFamily: typography.family.medium,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  packageText: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    marginTop: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  promptSection: {
    marginVertical: spacing.sm,
  },
  promptTitle: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  promptSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  inputWrapper: {
    marginVertical: spacing.md,
  },
  reasonInput: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    lineHeight: 18,
    borderRadius: 16,
    borderWidth: 1.2,
    padding: spacing.md,
    minHeight: 72,
    textAlignVertical: "top",
  },
  charCounterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 2,
  },
  charCounterText: {
    fontFamily: typography.family.medium,
    fontSize: 11,
  },
  antiPasteHint: {
    fontFamily: typography.family.regular,
    fontSize: 10,
    fontStyle: "italic",
  },
  chipsSection: {
    marginBottom: spacing.lg,
  },
  chipsLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: spacing.xs,
  },
  chipsSectionLabel: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  chipsScrollContent: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: typography.family.medium,
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontFamily: typography.family.medium,
    fontSize: 12,
  },
  confirmButton: {
    flex: 1.2,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
