/**
 * App-related type definitions
 */
export interface AppInfo {
  /** Android package name, e.g. "com.google.android.gm" */
  packageName: string;
  /** User-facing app label */
  label: string;
  /** Base64-encoded PNG icon from PackageManager (provided by native module) */
  icon: string | null;
  /** Whether this is a system app */
  isSystem: boolean;
}

export type AppCategory = "allowed" | "blocked" | "uncategorized";
