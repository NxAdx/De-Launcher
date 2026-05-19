/**
 * Storage adapter for De-Launcher.
 *
 * Native development builds use MMKV. Expo Go cannot load react-native-mmkv
 * because it depends on NitroModules, so Expo Go uses localStorage or memory.
 */
import Constants from "expo-constants";
import type { StateStorage } from "zustand/middleware";

type KeyValueStorage = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  remove: (key: string) => void;
};

const memory = new Map<string, string>();

function createFallbackStorage(): KeyValueStorage {
  return {
    getString: (key) => {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem(key) ?? undefined;
      }
      return memory.get(key);
    },
    set: (key, value) => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
        return;
      }
      memory.set(key, value);
    },
    remove: (key) => {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
        return;
      }
      memory.delete(key);
    },
  };
}

const storage: KeyValueStorage =
  Constants.appOwnership === "expo"
    ? createFallbackStorage()
    : (() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { createMMKV } = require("react-native-mmkv") as typeof import("react-native-mmkv");
          return createMMKV({ id: "de-launcher-storage" });
        } catch {
          return createFallbackStorage();
        }
      })();

export { storage };

/**
 * Zustand storage adapter.
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
