/**
 * Wellbeing Store — Zustand + MMKV
 *
 * Tracks screen time streak, best streak, and morning focus prompt presentation state.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "./storage";

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface WellbeingState {
  currentScreenStreak: number;
  bestScreenStreak: number;
  lastEvaluatedDate: string; // YYYY-MM-DD
  morningPromptLastDate: string; // YYYY-MM-DD

  // Actions
  evaluateDayStreak: (yesterdayScreenTimeMs: number, goalMs: number) => void;
  markMorningPromptShown: () => void;
  shouldShowMorningPrompt: (enabled: boolean, targetTime: string) => boolean;
  resetStreaks: () => void;
}

export const useWellbeingStore = create<WellbeingState>()(
  persist(
    (set, get) => ({
      currentScreenStreak: 0,
      bestScreenStreak: 0,
      lastEvaluatedDate: "",
      morningPromptLastDate: "",

      evaluateDayStreak: (yesterdayScreenTimeMs: number, goalMs: number) => {
        const yesterday = getYesterdayDateString();
        const { lastEvaluatedDate, currentScreenStreak, bestScreenStreak } = get();

        // Only evaluate once per day
        if (lastEvaluatedDate === yesterday) return;

        let newStreak = currentScreenStreak;
        if (yesterdayScreenTimeMs > 0 && yesterdayScreenTimeMs <= goalMs) {
          newStreak += 1;
        } else if (yesterdayScreenTimeMs > goalMs) {
          newStreak = 0;
        }

        const newBest = Math.max(bestScreenStreak, newStreak);
        set({
          currentScreenStreak: newStreak,
          bestScreenStreak: newBest,
          lastEvaluatedDate: yesterday,
        });
      },

      markMorningPromptShown: () => {
        set({ morningPromptLastDate: getTodayDateString() });
      },

      shouldShowMorningPrompt: (enabled: boolean, targetTime: string) => {
        if (!enabled) return false;
        const today = getTodayDateString();
        if (get().morningPromptLastDate === today) return false;

        const now = new Date();
        const [targetHours, targetMinutes] = targetTime.split(":").map(Number);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const targetTotalMinutes = (targetHours || 7) * 60 + (targetMinutes || 0);

        return currentMinutes >= targetTotalMinutes;
      },

      resetStreaks: () => {
        set({ currentScreenStreak: 0, bestScreenStreak: 0 });
      },
    }),
    {
      name: "delauncher-wellbeing",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
