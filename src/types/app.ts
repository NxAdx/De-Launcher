/**
 * App-related type definitions
 */
export interface AppInfo {
  /** Android package name, e.g. "com.google.android.gm" */
  packageName: string;
  /** User-facing app label */
  label: string;
  /** Base64-encoded or file URI PNG icon from PackageManager */
  icon: string | null;
  /** Monochrome / desaturated icon file URI */
  monoIcon?: string | null;
  /** Whether this is a system app */
  isSystem: boolean;
}

export type AppCategory = "allowed" | "blocked" | "uncategorized";

export interface FolderInfo {
  id: string;
  name: string;
  packageNames: string[];
  color?: string;
}

export type ScheduleType = 
  | "always_allowed" 
  | "work_hours"    // 09:00 - 17:00 weekdays
  | "evening_only"   // 18:00 - 22:00
  | "custom_window"  // user defined start/end
  | "time_limit"     // max minutes per day
  | "blocked";

export interface TimeWindow {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface AppScheduleRule {
  packageName: string;
  scheduleType: ScheduleType;
  customWindow?: TimeWindow;
  dailyLimitMinutes?: number;
}
