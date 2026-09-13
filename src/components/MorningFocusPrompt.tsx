/**
 * MorningFocusPrompt Component — De-Launcher
 *
 * Gentle morning intention prompt based on behavioral pre-commitment psychology.
 * Appears on the first unlock/open of the day at or after the configured morning time.
 * Once interacted with or dismissed, it will never show again for the rest of the day.
 */
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Sparkles, X, Plus, Check, ArrowRight } from "lucide-react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { spacing } from "@/src/theme/tokens";
import { useSettingsStore } from "@/src/store/settingsStore";
import { useWellbeingStore, getTodayDateString } from "@/src/store/wellbeingStore";
import { useTodoStore } from "@/src/store/todoStore";

export function MorningFocusPrompt() {
  const { colors, isDark } = useTheme();
  const enabled = useSettingsStore((s) => s.morningPromptEnabled);
  const targetTime = useSettingsStore((s) => s.morningPromptTime);
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  const shouldShow = useWellbeingStore((s) => s.shouldShowMorningPrompt);
  const markShown = useWellbeingStore((s) => s.markMorningPromptShown);

  const allTodos = useTodoStore((s) => s.todos);
  const addTodo = useTodoStore((s) => s.addTodo);

  const [visible, setVisible] = useState(false);
  const [taskText, setTaskText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const todayStr = useMemo(() => getTodayDateString(), []);
  const todayTodos = useMemo(
    () => allTodos.filter((t) => t.date === todayStr),
    [allTodos, todayStr]
  );

  useEffect(() => {
    // Check if we should pop up on mount
    const check = () => {
      if (shouldShow(enabled, targetTime)) {
        setVisible(true);
      }
    };
    const timer = setTimeout(check, 800); // Gentle delay after home screen loads
    return () => clearTimeout(timer);
  }, [enabled, targetTime, shouldShow]);

  const handleDismiss = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markShown();
    setVisible(false);
    Keyboard.dismiss();
  };

  const handleAddTask = () => {
    const trimmed = taskText.trim();
    if (!trimmed) return;
    if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addTodo(trimmed);
    setTaskText("");
    markShown();
    setVisible(false);
    Keyboard.dismiss();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable
          style={styles.backdrop}
          onPress={handleDismiss}
          accessibilityLabel="Dismiss morning prompt"
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? "#121212" : "#FFFFFF",
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerBadge}>
              <View
                style={[
                  styles.sparkleCircle,
                  { backgroundColor: colors.accentMuted, borderColor: colors.accent },
                ]}
              >
                <Sparkles size={16} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.greeting, { color: colors.textPrimary }]}>
                  Set Your Intention
                </Text>
                <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
                  Morning commitment contract
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={10}
            >
              <X size={16} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* If user already has tasks set */}
          {todayTodos.length > 0 ? (
            <View style={styles.contentSection}>
              <Text style={[styles.promptQuestion, { color: colors.textPrimary }]}>
                You have {todayTodos.length} {todayTodos.length === 1 ? "focus" : "focuses"} for today:
              </Text>

              <View style={styles.tasksList}>
                {todayTodos.slice(0, 3).map((todo) => (
                  <View
                    key={todo.id}
                    style={[
                      styles.taskItemPreview,
                      { backgroundColor: colors.cardBg, borderColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.taskCheckCircle,
                        { borderColor: todo.completed ? colors.accent : colors.textSecondary },
                      ]}
                    >
                      {todo.completed && <Check size={12} color={colors.accent} />}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.taskPreviewText,
                        {
                          color: todo.completed ? colors.textTertiary : colors.textPrimary,
                          textDecorationLine: todo.completed ? "line-through" : "none",
                        },
                      ]}
                    >
                      {todo.text}
                    </Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={handleDismiss}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: colors.accent },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.primaryButtonText}>Ready to Focus</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            /* Input for setting new main focus */
            <View style={styles.contentSection}>
              <Text style={[styles.promptQuestion, { color: colors.textPrimary }]}>
                What is your main focus today?
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <TextInput
                  ref={inputRef}
                  value={taskText}
                  onChangeText={setTaskText}
                  placeholder="e.g. Complete presentation, read 20 pages..."
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.input, { color: colors.textPrimary }]}
                  returnKeyType="done"
                  onSubmitEditing={handleAddTask}
                  autoFocus
                />
              </View>

              <View style={styles.buttonRow}>
                <Pressable
                  onPress={handleDismiss}
                  style={({ pressed }) => [
                    styles.ghostButton,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.ghostButtonText, { color: colors.textSecondary }]}>
                    Skip Today
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleAddTask}
                  disabled={!taskText.trim()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    {
                      backgroundColor: colors.accent,
                      opacity: taskText.trim() ? (pressed ? 0.85 : 1) : 0.4,
                    },
                  ]}
                >
                  <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.primaryButtonText}>Commit Focus</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: spacing.lg,
    paddingBottom: Platform.OS === "ios" ? spacing["2xl"] : spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sparkleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    fontSize: 15,
    fontWeight: "700",
  },
  subGreeting: {
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  contentSection: {
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  promptQuestion: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  inputWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === "ios" ? spacing.sm + 4 : spacing.xs,
  },
  input: {
    fontSize: 14,
    minHeight: 40,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  ghostButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  ghostButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  tasksList: {
    gap: spacing.xs + 2,
  },
  taskItemPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  taskCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  taskPreviewText: {
    fontSize: 13,
    flex: 1,
  },
});
