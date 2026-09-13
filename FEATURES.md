# De-Launcher — Features & Test Verification Guide

> **Official Quality Assurance Guide**  
> This file is the single source of truth for all launcher features, expected behavior, and step-by-step manual test cases. It is kept up to date on every improvement or bug fix.

---

## Master Feature Matrix & Test Procedures

### 1. Homescreen Clock & Date
- **Functionality**: Minimalist typography clock display with dynamic day greeting ("Good morning", "Good afternoon", "Good evening"), 12-hour digital time with AM/PM indicator, and localized date string.
- **Interactive Behavior**:
  - **Tapping the Time digits**: Triggers tactile haptic feedback and launches the system default Clock/Alarm application via Android's `AlarmClock.ACTION_SHOW_ALARMS` intent. If the OEM clock has no filter for this action, the launcher falls back to OEM packages (ColorOS/Oplus, Samsung, Google Deskclock, Xiaomi, Vivo, etc.) and searches installed launcher apps (e.g., Flip Clock).
  - **Tapping the Date row**: Triggers tactile haptic feedback and opens the system Calendar via `CalendarContract.CONTENT_URI` time view with fallback to `CATEGORY_APP_CALENDAR` and OEM packages.
- **Verification Steps**:
  1. From the home canvas, tap directly on the large hour:minute clock display.
  2. Verify a brief haptic click occurs and the phone's alarm/clock app opens immediately (no empty system resolver dialog).
  3. Return to home and tap directly on the date text ("Sunday, September 13").
  4. Verify the system calendar opens immediately.

---

### 2. Double-Tap Empty Space to Lock Screen
- **Functionality**: Allows locking the device screen directly from the homescreen canvas without pressing the hardware power button.
- **Expected Behavior**:
  - Double-tapping any blank/empty wallpaper area on the homescreen triggers screen off.
  - Screen locking is performed via Android's `AccessibilityService.GLOBAL_ACTION_LOCK_SCREEN` (API 28+). Unlike legacy Device Administrator lock, this modern approach **preserves biometric unlock** (fingerprint and face wake continue to work without requiring PIN entry).
  - **Permission Fallback**: If the Accessibility Service is not yet enabled by the user in Android Settings, the launcher presents an alert dialog: *"Accessibility Service Required: To turn off your screen with double-tap, De-Launcher needs Accessibility permission."* with an **Open Settings** button that directly opens Android's Accessibility Settings page.
- **Verification Steps**:
  1. On the homescreen, rapidly double-tap any empty space (e.g. above or below widgets, between app icons).
  2. If Accessibility Service is enabled: Verify screen immediately turns off. Wake device with fingerprint to verify biometric unlock is operational.
  3. If Accessibility Service is disabled: Verify the dialog pops up. Tap "Open Settings", enable De-Launcher under Downloaded Apps / Accessibility, return to home, and double-tap again to verify instant locking.
  4. In Settings -> Gestures & Interaction, toggle "Double-Tap to Lock" off. Double-tap the home canvas and verify the screen does not lock.

---

### 3. Customizable Swipe-Down Action
- **Functionality**: Configurable homescreen downward swipe gesture.
- **Options**:
  - **Search** (Default): Pulls down the Command Bar & App Search screen (`/search`).
  - **Notifications**: Pulls down the Android System Notification Shade without reaching for the top status bar.
- **Expected Behavior**:
  - A natural downward swipe with one hand registers smoothly without strict horizontal tilt penalties.
  - If "Notifications" is selected, the launcher invokes `GLOBAL_ACTION_NOTIFICATIONS` via Accessibility Service, with reflection on `StatusBarManager.expandNotificationsPanel()` as a fallback using `EXPAND_STATUS_BAR` permission.
- **Verification Steps**:
  1. Open Settings -> Gestures & Interaction -> Swipe Down Action.
  2. Select "Notifications".
  3. Return to homescreen. Swipe downward anywhere on the canvas with your thumb.
  4. Verify the Android notification shade smoothly pulls down.
  5. Return to Settings -> Gestures & Interaction -> Select "Search".
  6. Return to homescreen and swipe downward. Verify the Search & Command Bar modal opens with keyboard ready.

---

### 4. All Apps Drawer & Search
- **Functionality**: Full alphabetical list of all installed apps with category filtering, real-time query search, and intent controls.
- **Expected Behavior**:
  - Access via upward swipe on home or tapping the All Apps button.
  - Apps are **strictly and deterministically sorted alphabetically** by app label (with package name tie-breaker).
  - **Fast Scrolling Stability**: Rendered via optimized `FlatList` with fixed minimum row height (56px). Scrolling rapidly from A to Z and back to A never loses items, never causes items to flicker or disappear, and never displaces bottom items (like "Regain") to the top.
  - Filter chips: "All" (full catalog), "Allowed" (currently on home), "Blocked" (focus-shielded).
- **Verification Steps**:
  1. Swipe up on home to open All Apps (`/drawer`).
  2. Scroll down rapidly to the bottom and fling back to the top multiple times.
  3. Verify items remain strictly alphabetical ('A' apps at the top, 'Z' apps at the bottom) with zero jumping, duplication, or disappearance.
  4. Tap the "Allowed" chip and verify only apps currently placed on Home are displayed.
  5. Tap the "Blocked" chip and verify shielded apps are shown.
  6. Type a query into the top search bar; verify filtering is instantaneous.

---

### 5. App Grid & Focus Management
- **Functionality**: Curated homescreen grid displaying non-distracting allowed apps and folders.
- **Expected Behavior**:
  - Single tap: Launches app immediately if permitted. If the app is set to "Intent Pause" or blocked during focus schedule, routes to `/intent-pause` mindfulness barrier.
  - Long press: Opens contextual bottom sheet to Pin/Unpin from Home, Add to Dock, set Focus schedule, or view App Info.
- **Verification Steps**:
  1. Tap an allowed app on the home grid: App launches immediately.
  2. Long-press an app on home: Context menu opens with action options.

---

### 6. Dock & Navigation Gestures
- **Functionality**: Bottom pinned dock with support for 4 to 6 apps and frosted glass / transparent styling.
- **Expected Behavior**:
  - Dock icons remain fixed across home interactions.
  - Upward swipe anywhere on home opens the Drawer.
  - Back button on device exits search/drawer and returns cleanly to home.

---

### 7. Digital Wellbeing & Screen Time Widget
- **Functionality**: Live homescreen display of daily screen on time, unlock count, and percentage of user goal.
- **Expected Behavior**:
  - Updates in real-time when the launcher is brought to the foreground.
  - Tapping the widget opens Digital Wellbeing or Usage Access settings.

---

## Mandatory Maintenance Rule for Future Work
Whenever a new feature is added, modified, or bug-fixed:
1. Update this document (`FEATURES.md`) with the new or modified functionality, expected behaviors, and explicit test verification steps.
2. Run `npm test` to guarantee 0 TypeScript errors and 0 ESLint warnings.
3. Commit and push the updated `FEATURES.md` alongside code changes to Git.
