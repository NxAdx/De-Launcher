/**
 * DailyFocusModal Component — De-Launcher
 *
 * Full interactive bottom sheet / modal for Daily Focus & Consistency Heatmap.
 * Features:
 * - Structured 4-week × 7-day consistency calendar heatmap with weekday headers
 * - Interactive task checklist with smooth toggle, add, and delete
 * - Solid OLED dark / clean light card surfaces
 * - Zero-flicker task entry and keyboard handling
 */
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  Check,
  Plus,
  Trash2,
  Flame,
  Target,
  X,
  Sparkles,
} from "lucide-react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import { useTodoStore, HeatmapDay } from "@/src/store/todoStore";
import { useSettingsStore } from "@/src/store/settingsStore";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface DailyFocusModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DailyFocusModal({ visible, onClose }: DailyFocusModalProps) {
  const { colors, isDark } = useTheme();
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  const allTodos = useTodoStore((s) => s.todos);
  const history = useTodoStore((s) => s.history);
  const currentStreak = useTodoStore((s) => s.currentStreak);
  const addTodo = useTodoStore((s) => s.addTodo);
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);

  const todayStr = useMemo(() => getTodayDateString(), []);
  const todos = useMemo(
    () => allTodos.filter((t) => t.date === todayStr),
    [allTodos, todayStr]
  );

  const [newTodoText, setNewTodoText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Generate 28 days structured into 4 weeks of 7 days
  const weeks = useMemo<HeatmapDay[][]>(() => {
    const allDays: HeatmapDay[] = [];
    const now = new Date();

    for (let i = 27; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;

      const count = history[dateStr] ?? 0;
      let level: HeatmapDay["level"] = 0;
      if (count >= 4) level = 4;
      else if (count === 3) level = 3;
      else if (count === 2) level = 2;
      else if (count === 1) level = 1;

      allDays.push({ date: dateStr, count, level });
    }

    const structuredWeeks: HeatmapDay[][] = [];
    for (let w = 0; w < 4; w++) {
      structuredWeeks.push(allDays.slice(w * 7, (w + 1) * 7));
    }
    return structuredWeeks;
  }, [history]);

  const handleAdd = () => {
    if (!newTodoText.trim()) return;
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addTodo(newTodoText.trim());
    setNewTodoText("");
    setIsAdding(false);
  };

  const handleToggle = (id: string) => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTodo(id);
  };

  const handleDelete = (id: string) => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteTodo(id);
  };

  const getHeatmapColor = (level: HeatmapDay["level"]) => {
    switch (level) {
      case 1:
        return isDark ? "rgba(101, 125, 92, 0.45)" : "rgba(79, 101, 72, 0.4)";
      case 2:
        return isDark ? "rgba(101, 125, 92, 0.7)" : "rgba(79, 101, 72, 0.65)";
      case 3:
        return isDark ? "rgba(101, 125, 92, 0.9)" : "rgba(79, 101, 72, 0.85)";
      case 4:
        return isDark ? "#A3B899" : "#384B34";
      default:
        return isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  if (!visible) return null;

  const cardSurface = isDark ? "#171717" : "#FFFFFF";
  const cardBorderColor = isDark ? "#282828" : "#E2E8F0";

  return (
    <Modal
      visible={visible}
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
          entering={FadeInDown.duration(250)}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? "#121212" : "#F8FAFC",
              borderColor: cardBorderColor,
            },
          ]}
        >
          {/* Sheet Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.targetIconCircle, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}>
                <Target size={16} color={colors.accent} strokeWidth={2.4} />
              </View>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  Daily Focus
                </Text>
                <Text style={[styles.sheetSubtitle, { color: colors.accentTint }]}>
                  {completedCount} of {todos.length} tasks completed today
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[styles.closeButton, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}
            >
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Consistency Heatmap Card */}
            <View style={[styles.heatmapCard, { backgroundColor: cardSurface, borderColor: cardBorderColor }]}>
              <View style={styles.heatmapHeader}>
                <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                  Consistency (Last 4 Weeks)
                </Text>
                {currentStreak > 0 && (
                  <View style={styles.streakBadge}>
                    <Flame size={13} color="#EF4444" />
                    <Text style={[styles.streakBadgeText, { color: isDark ? "#FCA5A5" : "#DC2626" }]}>
                      {currentStreak}d streak
                    </Text>
                  </View>
                )}
              </View>

              {/* Weekday Labels Header */}
              <View style={styles.weekdayHeaderRow}>
                {WEEKDAYS.map((dayLabel, idx) => (
                  <Text key={idx} style={[styles.weekdayLabel, { color: colors.textTertiary }]}>
                    {dayLabel}
                  </Text>
                ))}
              </View>

              {/* 4 Rows of 7 Days Matrix */}
              <View style={styles.weeksContainer}>
                {weeks.map((week, wIdx) => (
                  <View key={wIdx} style={styles.weekRow}>
                    {week.map((day, dIdx) => (
                      <View
                        key={dIdx}
                        style={[
                          styles.heatmapCell,
                          {
                            backgroundColor: getHeatmapColor(day.level),
                            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                          },
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>

              {/* Heatmap Legend */}
              <View style={styles.legendRow}>
                <Text style={[styles.legendText, { color: colors.textTertiary }]}>Less</Text>
                <View style={[styles.legendDot, { backgroundColor: getHeatmapColor(0) }]} />
                <View style={[styles.legendDot, { backgroundColor: getHeatmapColor(1) }]} />
                <View style={[styles.legendDot, { backgroundColor: getHeatmapColor(2) }]} />
                <View style={[styles.legendDot, { backgroundColor: getHeatmapColor(3) }]} />
                <View style={[styles.legendDot, { backgroundColor: getHeatmapColor(4) }]} />
                <Text style={[styles.legendText, { color: colors.textTertiary }]}>More</Text>
              </View>
            </View>

            {/* Today's Tasks Section */}
            <View style={styles.tasksSection}>
              <View style={styles.tasksHeader}>
                <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                  Today&apos;s Intentional Tasks
                </Text>
                {!isAdding && todos.length < 5 && (
                  <Pressable
                    onPress={() => setIsAdding(true)}
                    style={[styles.addInlineButton, { backgroundColor: colors.accentMuted }]}
                  >
                    <Plus size={13} color={colors.accent} />
                    <Text style={[styles.addInlineText, { color: colors.accent }]}>
                      Add Task
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Add Task Input Form */}
              {isAdding && (
                <View style={[styles.addInputCard, { backgroundColor: cardSurface, borderColor: colors.accent }]}>
                  <TextInput
                    style={[styles.addInput, { color: colors.textPrimary }]}
                    placeholder="What is your main priority today?"
                    placeholderTextColor={colors.textTertiary}
                    value={newTodoText}
                    onChangeText={setNewTodoText}
                    onSubmitEditing={handleAdd}
                    returnKeyType="done"
                  />
                  <View style={styles.addInputActions}>
                    <Pressable onPress={() => { setIsAdding(false); setNewTodoText(""); }} style={styles.cancelAddBtn}>
                      <Text style={[styles.cancelAddText, { color: colors.textTertiary }]}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleAdd}
                      style={[styles.confirmAddBtn, { backgroundColor: colors.accent }]}
                    >
                      <Text style={styles.confirmAddText}>Add</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Task Items */}
              {todos.length === 0 && !isAdding ? (
                <View style={[styles.emptyCard, { backgroundColor: cardSurface, borderColor: cardBorderColor }]}>
                  <Sparkles size={20} color={colors.accentTint} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    No tasks set for today
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Set 1–3 high-leverage goals to maintain focus.
                  </Text>
                  <Pressable
                    onPress={() => setIsAdding(true)}
                    style={[styles.emptyAddButton, { backgroundColor: colors.accent }]}
                  >
                    <Plus size={14} color="#FFFFFF" />
                    <Text style={styles.emptyAddText}>Create First Task</Text>
                  </Pressable>
                </View>
              ) : (
                todos.map((todo) => (
                  <View
                    key={todo.id}
                    style={[
                      styles.todoItemRow,
                      {
                        backgroundColor: cardSurface,
                        borderColor: todo.completed ? "transparent" : cardBorderColor,
                        opacity: todo.completed ? 0.65 : 1,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => handleToggle(todo.id)}
                      style={styles.todoItemContent}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: todo.completed ? colors.accent : (isDark ? "#444444" : "#CBD5E1"),
                            backgroundColor: todo.completed ? colors.accent : "transparent",
                          },
                        ]}
                      >
                        {todo.completed && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      </View>

                      <Text
                        style={[
                          styles.todoText,
                          {
                            color: todo.completed ? colors.textTertiary : colors.textPrimary,
                            textDecorationLine: todo.completed ? "line-through" : "none",
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {todo.text}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleDelete(todo.id)}
                      hitSlop={8}
                      style={styles.deleteButton}
                    >
                      <Trash2 size={15} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  sheetContainer: {
    width: "100%",
    maxHeight: "85%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.2,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing["3xl"],
    zIndex: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  targetIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontFamily: typography.family.bold,
    fontSize: 18,
  },
  sheetSubtitle: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heatmapCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: spacing.md + 2,
    gap: spacing.sm,
  },
  heatmapHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeading: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  streakBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
  },
  weekdayHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginTop: 2,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: typography.family.bold,
    fontSize: 11,
  },
  weeksContainer: {
    gap: 6,
    marginVertical: 4,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  heatmapCell: {
    flex: 1,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  legendText: {
    fontFamily: typography.family.regular,
    fontSize: 10,
    marginHorizontal: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  tasksSection: {
    gap: spacing.sm,
  },
  tasksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addInlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  addInlineText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
  },
  addInputCard: {
    borderRadius: 16,
    borderWidth: 1.2,
    padding: spacing.md,
    gap: spacing.sm,
  },
  addInput: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    padding: 0,
  },
  addInputActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  cancelAddBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cancelAddText: {
    fontFamily: typography.family.medium,
    fontSize: 12,
  },
  confirmAddBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  confirmAddText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: "#FFFFFF",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    borderRadius: 20,
    borderWidth: 1.2,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    marginTop: 4,
  },
  emptySubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    textAlign: "center",
  },
  emptyAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: spacing.sm,
  },
  emptyAddText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: "#FFFFFF",
  },
  todoItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1.2,
  },
  todoItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  todoText: {
    fontFamily: typography.family.medium,
    fontSize: 13,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
});
