/**
 * DailyFocusModal Component
 *
 * Full interactive bottom sheet / modal for Daily Focus & Consistency Heatmap.
 * Keeps the homescreen uncluttered while giving users a rich, dedicated focus space.
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

  const heatmapData = useMemo<HeatmapDay[]>(() => {
    const result: HeatmapDay[] = [];
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

      result.push({ date: dateStr, count, level });
    }

    return result;
  }, [history]);

  const handleAdd = () => {
    if (!newTodoText.trim()) return;
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addTodo(newTodoText);
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
        return isDark ? "rgba(101, 125, 92, 0.4)" : "rgba(79, 101, 72, 0.35)";
      case 2:
        return isDark ? "rgba(101, 125, 92, 0.65)" : "rgba(79, 101, 72, 0.6)";
      case 3:
        return isDark ? "rgba(101, 125, 92, 0.85)" : "rgba(79, 101, 72, 0.85)";
      case 4:
        return isDark ? "#A3B899" : "#384B34";
      default:
        return isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)";
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          entering={FadeInDown.duration(250)}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark
                ? "rgba(20, 20, 20, 0.98)"
                : "rgba(252, 252, 252, 0.98)",
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Sheet Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.targetIconCircle, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}>
                <Target size={16} color={colors.accent} strokeWidth={2.2} />
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
              style={[styles.closeButton, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}
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
            <View style={[styles.heatmapCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
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

              {/* Centered Heatmap Grid: 4 weeks (rows) of 7 days (cols) */}
              <View style={styles.heatmapGrid}>
                {heatmapData.map((day, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.heatmapCell,
                      {
                        backgroundColor: getHeatmapColor(day.level),
                        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                      },
                    ]}
                  />
                ))}
              </View>

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
                <View style={[styles.addInputCard, { backgroundColor: colors.cardBg, borderColor: colors.accent }]}>
                  <TextInput
                    style={[styles.addInput, { color: colors.textPrimary }]}
                    placeholder="What is your single main priority today?"
                    placeholderTextColor={colors.textTertiary}
                    value={newTodoText}
                    onChangeText={setNewTodoText}
                    autoFocus
                    onSubmitEditing={handleAdd}
                    returnKeyType="done"
                  />
                  <View style={styles.addInputActions}>
                    <Pressable onPress={() => setIsAdding(false)} style={styles.cancelAddBtn}>
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
                <View style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
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
                        backgroundColor: colors.cardBg,
                        borderColor: todo.completed ? "transparent" : colors.cardBorder,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => handleToggle(todo.id)}
                      style={styles.todoCheckArea}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: todo.completed ? colors.accent : colors.cardBorder,
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
    backgroundColor: "rgba(0, 0, 0, 0.65)",
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
  heatmapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 4,
    marginVertical: 4,
  },
  heatmapCell: {
    width: "12.5%",
    aspectRatio: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 2,
  },
  legendText: {
    fontFamily: typography.family.regular,
    fontSize: 10,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  tasksSection: {
    gap: spacing.sm,
  },
  tasksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  addInlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  },
  addInputActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  cancelAddBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  cancelAddText: {
    fontFamily: typography.family.medium,
    fontSize: 12,
  },
  confirmAddBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: 999,
  },
  confirmAddText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: "#FFFFFF",
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: spacing.xs,
  },
  emptyAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: spacing.xs,
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
    borderWidth: 1,
  },
  todoCheckArea: {
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
    lineHeight: 18,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
    marginLeft: spacing.sm,
  },
});
