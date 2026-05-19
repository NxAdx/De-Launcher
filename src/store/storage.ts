/**
 * MMKV Storage instance for De-Launcher
 */
import { createMMKV } from "react-native-mmkv";
import type { MMKV } from "react-native-mmkv";
import type { StateStorage } from "zustand/middleware";

// MMKV instance — will be initialized at runtime on device.
// In dev/web environments, fall back gracefully.
let storage: MMKV;
try {
  storage = createMMKV({ id: "de-launcher-storage" });
} catch {
  // Fallback for environments where MMKV native module isn't available
  storage = {
    getString: () => undefined,
    set: () => {},
    remove: () => {},
  } as unknown as MMKV;
}
export { storage };

/**
 * Zustand storage adapter for MMKV.
 * Enables persist middleware to use MMKV instead of AsyncStorage.
 */
export const mmkvStorage: StateStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.remove(name);
  },
};
