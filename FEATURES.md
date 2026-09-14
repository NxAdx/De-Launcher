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

---

### 8. System & OEM Immunity Protection (Zero Unwanted Popups)
- **Functionality**: Immune protection for Android system components, navigation gestures, lockscreen plugins, and input methods (keyboards).
- **Expected Behavior**:
  - The accessibility shield service (`DistractionService`) explicitly grants immunity to all packages flagged with `ApplicationInfo.FLAG_SYSTEM`, packages without launcher intents, input method packages (keyboards), and OEM system plugins (`com.vivo.*`, `com.samsung.*`, `com.miui.*`, `com.coloros.*`, etc.).
  - Gestures like Vivo's navigation upslide (`com.vivo.upslide`) or lockscreen plugin (`com.vivo.systemuiplugin`) are never intercepted or treated as unauthorized apps.
  - The red disruptive error banner on homescreen (*"com.vivo.upslide is not in Focus apps"*) is permanently removed.
  - Unpinned installed apps default to allowed; only apps explicitly configured as "Blocked" or "Intent Pause" trigger focus protection.
- **Verification Steps**:
  1. On devices with OEM navigation gestures (e.g. Vivo, Oppo, Xiaomi, Samsung), perform home/back/recent swipe gestures repeatedly.
  2. Verify no error banners or redirection popups flash on the screen.
  3. Turn screen off and unlock the phone. Verify the homescreen loads cleanly without any unwanted popups.

---

### 9. Return-to-Home After Lock [Focus+]
- **Functionality**: Automatically navigates back to the De-Launcher homescreen if the phone remains locked past a configured timeout, breaking app multitasking rabbit holes.
- **Configurable Settings**: Settings -> Focus & Distraction Shield -> Return to Home on Lock (Toggle), Lock Return Timeout (0m Instant, 2m, 5m, 10m).
- **Expected Behavior**:
  - Native broadcast receiver monitors `ACTION_SCREEN_OFF` and `ACTION_USER_PRESENT`.
  - When the screen turns off, the timestamp is recorded.
  - If the user unlocks the phone after elapsed minutes >= timeout, `DeLauncherNativeModule` automatically starts the launcher main activity with `FLAG_ACTIVITY_NEW_TASK | FLAG_ACTIVITY_CLEAR_TOP`, greeting the user with the calm homescreen instead of returning them to the rabbit-hole app they were last using.
- **Verification Steps**:
  1. Open Settings -> Focus & Distraction Shield -> Enable "Return to Home on Lock" and set timeout to "0m" (instant for testing).
  2. Open any app (e.g. Browser or Calculator).
  3. Press power button to lock the device.
  4. Wait 3 seconds and unlock the device.
  5. Verify the device immediately lands on De-Launcher's clean home canvas rather than the previous app.
  6. In Settings, toggle the feature off. Open an app, lock, and unlock; verify the previous app remains in the foreground.

---

### 10. Mindful Breathing Gate [Focus+]
- **Functionality**: A mandatory 4-second paced breathing friction barrier (2s inhale, 2s exhale) triggered whenever accessing distracting or intent-pause apps.
- **Permanent Core Behavior**: Active by default on all intent-pause barriers without requiring toggle management or configuration clutter.
- **Expected Behavior**:
  - Tapping an app marked as "Require Intent Pause" or "Blocked" presents an upfront calming breathing circle with smooth scale animation.
  - Text prompts guide the user: *"Breathe in slowly..."* (0-2s) followed by *"Breathe out gently..."* (2-4s) with a 4-second countdown.
  - Prominent "Stay Focused (Return Home)" button enables effortless mindful bailout.
  - Once the breath finishes, smooth haptic feedback transitions to the intentionality duration form.
- **Verification Steps**:
  1. Long-press an app on home or drawer, select "Require Intent Pause".
  2. Tap the app to launch it.
  3. Verify the screen opens to "Mindful Pause" with a pulsating breathing circle and 4-second countdown.
  4. Tap "Stay Focused": verify you return immediately to the homescreen without opening the app.
  5. Tap the app again and allow the 4 seconds to complete: verify it smoothly transitions to the Session Options form.

---

### 11. User-Controlled Hidden Apps & Drawer Filtering [Focus+]
- **Functionality**: Full user-controlled hiding and unhiding of any app from All Apps drawer browsing, with instant search retrieval and a dedicated management center in Settings.
- **Expected Behavior**:
  - **Context Menu Action**: Long-pressing any app (on Home, Dock, or Drawer) presents a contextual option:
    - If visible: *"Hide App from Drawer"* (with `EyeOff` icon).
    - If already hidden: *"Unhide App (Show in Drawer)"* (with `Eye` accent icon).
  - **Drawer Browsing Filter**: When browsing the drawer with an empty search query, all hidden apps are completely excluded from the list. The drawer header displays a subtle counter: `"{N} hidden · Search to reveal"`.
  - **Intentional Search Access**: When typing into the drawer search bar, matching apps—even if hidden—are displayed with a subtle `Hidden` badge, ensuring deliberate search remains fully functional.
  - **Hidden Apps Manager**: Settings -> Focus & Distraction Shield -> **"Hidden Apps"** displays the count of hidden apps. Tapping it opens a bottom sheet modal listing every hidden app with icon, title, package name, and a 1-tap **Unhide** button.
- **Verification Steps**:
  1. In the All Apps Drawer (`/drawer`), long-press any app and tap "Hide App from Drawer".
  2. Verify an Android confirmation toast appears (*"{App} hidden from drawer"*) and the app disappears from drawer browsing.
  3. Verify the drawer count row shows `"1 hidden · Search to reveal"`.
  4. Type the hidden app's name in the drawer search bar: verify the app appears with a `Hidden` badge and can still be launched or configured.
  5. Open Settings -> Focus & Distraction Shield -> tap "Hidden Apps".
  6. Verify the bottom sheet displays the hidden app. Tap "Unhide" on the app row.
  7. Return to the All Apps drawer and verify the app is back in the default browsing list.

---

### 12. Customizable Theme Accent Palettes
- **Functionality**: Curated, dopamine-free color accent palettes tailored for minimalist distraction-free focus.
- **Available Presets**:
  - **Sage Oasis (`#8EAB82`)** (Default): Calming botanical green, natural and organic with 6.5:1 high-readability contrast on dark surfaces.
  - **Nordic Slate (`#7E99A8`)**: Cool icy-blue slate for sharp clarity and focused work environments.
  - **Warm Sand (`#C4A482`)**: Muted sepia / amber warmth, soft on the eyes for night-time or reader setups.
  - **Monochrome (`#FFFFFF` / `#E2E8F0`)**: 100% distraction-free silver-white on OLED pure black.
- **Reactive Global Application**:
  - Selecting any preset immediately transforms all launcher accents in real-time (widgets, Screen Time progress bar, streak flame badges, task completion checkmarks, search bar glow, context menus, settings switches, and active filter chips).
  - Persisted in MMKV storage across app restarts.
- **Verification Steps**:
  1. Open Settings -> Appearance & Icons -> "Theme Accent".
  2. Tap the "Nordic Slate" circular swatch.
  3. Verify tactile selection haptic feedback triggers, the swatch gets an active white ring indicator, and the label updates to "Palette: Nordic Slate".
  4. Return to the homescreen: verify the Screen Time progress bar, streak badge, and active highlights are immediately rendered in Nordic Slate blue.
  5. Return to Settings and select "Warm Sand": verify all accents shift to warm sepia amber.
  6. Select "Monochrome": verify all accents shift to high-contrast white and silver.
  7. Select "Sage Oasis": verify default botanical green is restored.

---

## Mandatory Maintenance Rule for Future Work
1. Whenever a new feature is added, modified, or bug-fixed:
   - Update this document (`FEATURES.md`) with the new or modified functionality, expected behaviors, and explicit test verification steps.
   - Run `npm test` to guarantee 0 TypeScript errors and 0 ESLint warnings.
   - Commit and push the updated `FEATURES.md` alongside code changes to Git.

