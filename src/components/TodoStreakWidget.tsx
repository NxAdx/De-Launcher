import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { Target, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import { useTodoStore } from "@/src/store/todoStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { DailyFocusModal } from "./DailyFocusModal";

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TodoStreakWidget() {
  const { colors } = useTheme();
  const showTodoWidget = useSettingsStore((s) => s.showTodoWidget);
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  const allTodos = useTodoStore((s) => s.todos);
  const [showModal, setShowModal] = useState(false);

  const todayStr = useMemo(() => getTodayDateString(), []);
  const todos = useMemo(
    () => allTodos.filter((t) => t.date === todayStr),
    [allTodos, todayStr]
  );

  if (!showTodoWidget) return null;

  const handlePress = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowModal(true);
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <>
      <View style={styles.wrapper}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.container,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
            pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open daily focus tasks and consistency heatmap"
        >
          <View style={styles.headerLeft}>
            <View style={[styles.focusIconCircle, { borderColor: colors.accent, backgroundColor: colors.accentMuted }]}>
              <Target size={15} color={colors.accent} strokeWidth={2.2} />
            </View>
            <View style={styles.headerTextGroup}>
              <View style={styles.headerTopRow}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  DAILY FOCUS
                </Text>
                <Text style={[styles.taskCount, { color: colors.accentTint }]}>
                  {completedCount} / {todos.length} completed
                </Text>
              </View>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Stay intentional. Make progress.
              </Text>
            </View>
          </View>

          <ChevronRight size={18} color={colors.textSecondary} style={{ marginRight: 2 }} />
        </Pressable>
      </View>

      <DailyFocusModal visible={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.xl,
    marginVertical: spacing.xs,
    width: "100%",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    height: 52,
    borderRadius: 24,
    borderWidth: 1.2,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
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
    fontFamily: typography.family.bold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  taskCount: {
    fontFamily: typography.family.medium,
    fontSize: 12,
  },
  subtitle: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    marginTop: 1,
  },
});
