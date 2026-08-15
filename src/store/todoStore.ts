/**
 * Todo Store — Zustand + MMKV
 *
 * Manages daily intentional tasks and GitHub-style contribution streak history.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "./storage";

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = none, 1 = 1 task, 2 = 2 tasks, 3 = 3 tasks, 4 = 4+ tasks
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface TodoState {
  todos: TodoItem[];
  history: Record<string, number>; // date (YYYY-MM-DD) -> completed tasks count
  currentStreak: number;
  bestStreak: number;

  // Actions
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  getTodayTodos: () => TodoItem[];
  getHeatmapData: (daysCount?: number) => HeatmapDay[];
  calculateStreak: () => void;
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [],
      history: {},
      currentStreak: 0,
      bestStreak: 0,

      addTodo: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const today = getTodayDateString();
        const newTodo: TodoItem = {
          id: `todo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          text: trimmed,
          completed: false,
          date: today,
          createdAt: Date.now(),
        };
        set((state) => ({ todos: [newTodo, ...state.todos] }));
      },

      toggleTodo: (id) => {
        const today = getTodayDateString();
        set((state) => {
          const updatedTodos = state.todos.map((item) => {
            if (item.id === id) {
              return { ...item, completed: !item.completed };
            }
            return item;
          });

          // Recompute completed count for the specific item's date
          const targetItem = state.todos.find((t) => t.id === id);
          const targetDate = targetItem?.date || today;
          const completedCount = updatedTodos.filter(
            (t) => t.date === targetDate && t.completed
          ).length;

          const updatedHistory = {
            ...state.history,
            [targetDate]: completedCount,
          };

          return {
            todos: updatedTodos,
            history: updatedHistory,
          };
        });

        get().calculateStreak();
      },

      deleteTodo: (id) => {
        set((state) => {
          const target = state.todos.find((t) => t.id === id);
          const updated = state.todos.filter((t) => t.id !== id);
          if (!target) return { todos: updated };

          const targetDate = target.date;
          const completedCount = updated.filter(
            (t) => t.date === targetDate && t.completed
          ).length;

          return {
            todos: updated,
            history: {
              ...state.history,
              [targetDate]: completedCount,
            },
          };
        });
        get().calculateStreak();
      },

      getTodayTodos: () => {
        const today = getTodayDateString();
        return get().todos.filter((t) => t.date === today);
      },

      getHeatmapData: (daysCount = 28) => {
        const history = get().history;
        const result: HeatmapDay[] = [];
        const today = new Date();

        for (let i = daysCount - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;
          const count = history[dateStr] || 0;

          let level: 0 | 1 | 2 | 3 | 4 = 0;
          if (count >= 4) level = 4;
          else if (count === 3) level = 3;
          else if (count === 2) level = 2;
          else if (count === 1) level = 1;

          result.push({ date: dateStr, count, level });
        }

        return result;
      },

      calculateStreak: () => {
        const history = get().history;
        let streak = 0;
        const now = new Date();

        // Check today
        const todayStr = getTodayDateString();
        const completedToday = (history[todayStr] || 0) > 0;

        // If completed today, start counting from today; otherwise start checking from yesterday
        let checkDate = new Date(now);
        if (!completedToday) {
          checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
          const y = checkDate.getFullYear();
          const m = String(checkDate.getMonth() + 1).padStart(2, "0");
          const d = String(checkDate.getDate()).padStart(2, "0");
          const dateStr = `${y}-${m}-${d}`;

          if ((history[dateStr] || 0) > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        const best = Math.max(get().bestStreak, streak);
        set({ currentStreak: streak, bestStreak: best });
      },
    }),
    {
      name: "todo-store",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
