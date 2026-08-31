/**
 * TodoStreakWidget Component
 *
 * Minimalist Daily Focus & GitHub-style Contribution Streak Heatmap.
 * Features:
 * - 28-day activity heatmap grid
 * - Interactive task checklist with haptic feedback
 * - Streak counter
 * - Collapsible / expandable minimal design
 */
import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
} from "react-native";
import { Check, Plus, Trash2, Flame, CircleDot, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
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

interface TodoStreakWidgetProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function TodoStreakWidget({ isExpanded: controlledExpanded, onToggleExpand }: TodoStreakWidgetProps = {}) {
  const { colors, isDark } = useTheme();
  const showTodoWidget = useSettingsStore((s) => s.showTodoWidget);
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  // Directly subscribe to store arrays/objects for instant reactive updates
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

  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const [newTodoText, setNewTodoText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  if (!showTodoWidget) return null;

  const toggleExpand = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

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
        return isDark ? "rgba(148, 163, 184, 0.3)" : "rgba(100, 116, 139, 0.3)";
      case 2:
        return isDark ? "rgba(148, 163, 184, 0.55)" : "rgba(100, 116, 139, 0.55)";
      case 3:
        return isDark ? "rgba(148, 163, 184, 0.8)" : "rgba(100, 116, 139, 0.8)";
      case 4:
        return isDark ? "#E2E8F0" : "#1E293B";
      default:
        return isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)";
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderColor: colors.border }]}>
      {/* Compact Header — matching Design System mockup */}
      <Pressable
        onPress={toggleExpand}
        style={styles.header}
        accessibilityRole="button"
      >
        <View style={styles.headerLeft}>
          <View style={[styles.focusIconCircle, { borderColor: colors.accent }]}>
            <CircleDot size={16} color={colors.accent} />
          </View>
          <View style={styles.headerTextGroup}>
            <View style={styles.headerTopRow}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                DAILY FOCUS
              </Text>
              <Text style={[styles.taskCount, { color: colors.textTertiary }]}>
                {completedCount} / {todos.length} completed
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              Stay intentional. Make progress.
            </Text>
          </View>
        </View>

        <ChevronRight size={20} color={colors.textTertiary} />
      </Pressable>

      {/* Expanded Content — animated height for smooth 120fps transition */}
      <ExpandableBody isExpanded={isExpanded}>
        {/* GitHub-style Contribution Heatmap Matrix (4 columns of 7 days) */}
          <View style={styles.heatmapSection}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary, marginBottom: 0 }]}>
                Consistency (Last 4 Weeks)
              </Text>
              {currentStreak > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Flame size={12} color="#EF4444" />
                  <Text style={{ fontSize: 10, fontFamily: typography.family.bold, color: isDark ? "#FCA5A5" : "#DC2626" }}>
                    {currentStreak}d streak
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.heatmapGrid}>
              {heatmapData.map((day, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.heatmapCell,
                    { backgroundColor: getHeatmapColor(day.level), borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Todo List */}
          <View style={styles.todosSection}>
            {todos.length === 0 && !isAdding && (
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                No tasks set for today. Add 1–3 intentional tasks.
              </Text>
            )}

            {todos.map((todo) => (
              <View key={todo.id} style={styles.todoRow}>
                <Pressable
                  onPress={() => handleToggle(todo.id)}
                  style={[
                    styles.checkbox,
                    {
                      borderColor: todo.completed ? colors.accent : colors.textTertiary,
                      backgroundColor: todo.completed ? colors.accent : "transparent",
                    },
                  ]}
                  hitSlop={8}
                >
                  {todo.completed && <Check size={12} color="#0A0A0A" strokeWidth={3} />}
                </Pressable>

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

                <Pressable
                  onPress={() => handleDelete(todo.id)}
                  hitSlop={8}
                  style={styles.deleteButton}
                >
                  <Trash2 size={14} color={colors.textTertiary} />
                </Pressable>
              </View>
            ))}

            {/* Inline Add Input */}
            {isAdding ? (
              <View style={styles.addInputRow}>
                <TextInput
                  value={newTodoText}
                  onChangeText={setNewTodoText}
                  placeholder="Focus task name..."
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                  onSubmitEditing={handleAdd}
                  returnKeyType="done"
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                />
                <Pressable
                  onPress={handleAdd}
                  style={[styles.confirmAddBtn, { backgroundColor: colors.accent }]}
                >
                  <Text style={[styles.confirmAddText, { color: "#0A0A0A" }]}>Add</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setIsAdding(true)}
                style={styles.addTrigger}
              >
                <Plus size={14} color={colors.textSecondary} />
                <Text style={[styles.addTriggerText, { color: colors.textSecondary }]}>
                  Add intentional task
                </Text>
              </Pressable>
            )}
          </View>
      </ExpandableBody>
    </View>
  );
}

/**
 * ExpandableBody — Smooth 120fps height animation using Reanimated.
 * Always mounted (no mount/unmount jank). Opacity + maxHeight animate together.
 * Inspired by Kvaesitso's fluid widget expansion.
 */
function ExpandableBody({ isExpanded, children }: { isExpanded: boolean; children: React.ReactNode }) {
  const progress = useSharedValue(isExpanded ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isExpanded ? 1 : 0, {
      duration: 250,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    });
  }, [isExpanded, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: progress.value * 400,
    opacity: progress.value,
    overflow: "hidden" as const,
  }));

  return (
    <Animated.View style={[styles.expandedBody, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.xl,
    marginVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  streakText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
  },
  focusIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontFamily: typography.family.semiBold,
    fontSize: typography.size.xs,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  taskCount: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
  },
  subtitle: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  miniHeatmap: {
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
  },
  miniCell: {
    width: 6,
    height: 6,
    borderRadius: 2,
  },
  expandedBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: 2,
  },
  heatmapSection: {
    marginBottom: spacing.xs,
    paddingTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  sectionLabel: {
    fontFamily: typography.family.regular,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  heatmapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    justifyContent: "space-between",
  },
  heatmapCell: {
    width: 8,
    height: 8,
    borderRadius: 2,
    borderWidth: 0.5,
  },
  todosSection: {
    gap: spacing.xs,
  },
  emptyText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    fontStyle: "italic",
    paddingVertical: spacing.xs,
  },
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  todoText: {
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
  },
  deleteButton: {
    padding: 4,
    marginLeft: spacing.xs,
  },
  addInputRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
  },
  confirmAddBtn: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmAddText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
  },
  addTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    marginTop: 2,
  },
  addTriggerText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
  },
});
