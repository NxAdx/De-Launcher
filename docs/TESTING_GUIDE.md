# 🧪 De-Launcher — Comprehensive Feature, Architecture & Testing Guide

This guide gives you an exhaustive reference to test and cross-check every single screen, widget, gesture, and behavioral mechanic in **De-Launcher**, benchmarked against **Kvaesitso**, **KISS Launcher**, **Olauncher**, and **Lawnchair**.

---

## 📑 Feature Testing Matrix

| # | Feature / Screen | Primary Purpose | Expected Behavior |
|---|---|---|---|
| **1** | **Daily Focus & Heatmap** | Habit consistency & intentional tasks | 4-week calendar heatmap + zero-flicker task checklist |
| **2** | **Monochrome Icon Mode** | Dopamine-free grayscale phone UX | Native grayscale desaturation without blank/white silhouettes |
| **3** | **Dock App Configuration** | Selective dock customization | Bottom safe insets so last app is never cut off |
| **4** | **Mindful Gate (Intent Pause)** | Friction barrier for distracting apps | Solid OLED background + static fixed-height time buttons |
| **5** | **Keyboard-Driven Search** | Instant System-2 navigation | Auto-focused keyboard + Enter/Return instant launch |
| **6** | **Post-Session Goal Reflection** | Meta-awareness habit feedback | Prompt banner on return to launcher ("Did you finish goal?") |
| **7** | **Intentional Pinning** | Strict home curation | Reason requirement (min 10 chars) before pinning to Home |
| **8** | **Permanent Frosted Dock** | Tactile one-handed ergonomics | 120 FPS horizontal drag-to-reorder + haptic feedback |

---

## 🔍 Detailed Component & Verification Guides

---

### 1. 📊 Daily Focus Modal & Heatmap Sheet
* **How to Trigger**: Tap the **DAILY FOCUS** pill widget on the Home Screen.
* **Key Elements**:
  * **Header**: Target icon badge + Completed count (`"X of Y tasks completed today"`) + Close button.
  * **Consistency Heatmap**:
    * Clean weekday header row: `M`, `T`, `W`, `T`, `F`, `S`, `S`.
    * 4 solid horizontal rows representing 28 days of consistency.
    * 5 distinct color levels (`Level 0` = faint card outline, `Level 1–4` = graduating sage/emerald tones).
    * Streak flame badge: Displays active consecutive streak count.
    * Legend row: `Less` `[0] [1] [2] [3] [4]` `More`.
  * **Task Checklist**:
    * Interactive task rows with custom rounded checkbox.
    * Tapping checkbox: Strikes through text, reduces opacity to 65%, and plays success haptic.
    * Trash icon: Deletes task with medium haptic.
    * Inline `+ Add Task`: Expands an inline input field without layout flicker or double keyboard jumps.
* **Verification Checks**:
  - [ ] Heatmap squares have fixed height (26px) and are evenly distributed across all 7 columns.
  - [ ] Tapping `+ Add Task` opens the input smoothly without any screen flicker.
  - [ ] Completing a task updates the Home screen pill widget immediately upon closing the sheet.

---

### 2. 🖤 Dopamine-Free Monochrome Icons
* **How to Trigger**: Open **Settings** ➔ **Appearance** ➔ Tap **Monochrome**.
* **Key Elements**:
  * Home Grid app icons.
  * Dock capsule icons.
  * App Drawer list icons.
  * Search results list icons.
* **Expected Behavior**:
  * System app icons (PNG / WebP bitmaps) are converted natively into crisp, high-resolution grayscale images.
  * Internal glyphs, brand marks, letters, and shapes (e.g. Chrome circle, WhatsApp phone, YouTube play button) remain **100% visible and sharp**.
  * No icons are turned into flat solid white or gray blocks.
  * Tapping **Standard** in Settings instantly restores full vibrant colors.
* **Verification Checks**:
  - [ ] Switch to Monochrome ➔ Verify all icons on Home & Dock show complete icon details in grayscale.
  - [ ] Switch back to Standard ➔ Verify original brand colors reappear immediately.

---

### 3. 🧊 Dock Configuration (`dock-settings.tsx`)
* **How to Trigger**: Open **Settings** ➔ **Dock** ➔ Tap **Configure Dock Apps →**.
* **Key Elements**:
  * Slot indicator dots (`4 / 5 slots` filled).
  * Search input to quickly filter installed apps.
  * Reorderable list of docked apps (with drag handle `≡` on the left) and toggle switch on the right.
  * Alphabetical list of available apps with toggle switches.
* **Expected Behavior**:
  * Smooth drag-and-drop to reorder docked shortcuts with haptics.
  * Scrolling all the way to the bottom of the list reveals the last app (e.g. `YouTube`, `Workspace`) with full clearance above the Android system navigation bar.
* **Verification Checks**:
  - [ ] Scroll to the very bottom of the app list ➔ Verify the bottom-most app is 100% visible and toggle switch is easy to tap.

---

### 4. 🛡️ Mindful Gate Friction Barrier (`intent-pause.tsx`)
* **How to Trigger**: Tap any distracting app (e.g. Reddit, YouTube, Instagram) in Search or Drawer.
* **Key Elements**:
  * **Top Card**: Full-bleed solid OLED dark surface (`#0D0D0D`) with app icon, app label, and `🛡️ MINDFUL GATE` badge.
  * **Step 1: Goal Input**: Multiline text input with copy-paste prevention (`contextMenuHidden`). Must enter at least 8 characters. Quick suggestion chips available below.
  * **Step 2: Time Budget**: 4 fixed-height buttons (`3 min`, `5 min`, `10 min`, `15 min`).
  * **Step 3: Daily Focus Progress**: Checkbox acknowledging today's intentional progress.
  * **Action Button**: Primary `[ Unlock for X Minutes -> ]` + Secondary `[ I actually don't need this right now ]`.
  * **Breathing Cooldown**: 3-second pulsating circle before launching.
* **Expected Behavior**:
  * Absolutely **zero background bleed-through** (the underlying App Drawer or Home screen never shows through).
  * Tapping between `3 min`, `5 min`, `10 min`, and `15 min` buttons **does NOT resize or jump any button dimensions**.
* **Verification Checks**:
  - [ ] Tap between all 4 time buttons ➔ Verify they remain identical in size and layout is completely stable.
  - [ ] Verify that background drawer text does not show through behind the cards.

---

### 5. ⌨️ Keyboard-Driven Instant Search Launch
* **How to Trigger**: Swipe down on Home screen (or tap Search bar).
* **Key Elements**:
  * Search input automatically focused with virtual keyboard open.
  * Real-time fuzzy filtering of apps, commands, and settings shortcuts.
  * Top matching result highlighted at the top of the list.
* **Expected Behavior**:
  * Typing `ch` brings `Chrome` to the top.
  * Pressing the **Go / Search / Enter** key on the virtual keyboard launches `Chrome` directly.
* **Verification Checks**:
  - [ ] Open search, type 2 letters, press keyboard Enter ➔ Verify top match opens immediately.

---

### 6. 🎯 Post-Session Goal Reflection Banner
* **How to Trigger**: Complete an intentional session in a gated app and return to Home.
* **Key Elements**:
  * Floating frosted card appearing directly above the App Grid on Home.
  * Target badge + `"Mindful Session • [App Name]"`.
  * Prompt: *"Did you accomplish your goal? '[Your Goal]' in [App Name]"*.
  * Action 1: `[ ✅ Yes, done ]` ➔ Positive toast, logs outcome, dismisses card.
  * Action 2: `[ ⚠️ Got distracted ]` ➔ Mindful encouraging toast, logs outcome, dismisses card.
* **Verification Checks**:
  - [ ] Open gated app for 3 min ➔ Press Home button ➔ Verify reflection card appears.
  - [ ] Tap `Yes, done` ➔ Verify success toast and smooth exit animation.

---

### 7. 📌 Intentional Pinning Checkpoint
* **How to Trigger**: Open App Drawer ➔ Long-press any app ➔ Tap **"Add to Home Screen (Requires Reason)"**.
* **Key Elements**:
  * Pin Modal asking *"Why does this app belong on your Home Screen?"*.
  * Minimum 10-character reason input or quick inspiration chips.
* **Expected Behavior**:
  * Pinned app appears on Home.
  * Long-pressing the app on Home displays: *"📌 Pinned for: [Your Reason]"* in the context menu header.
* **Verification Checks**:
  - [ ] Add app with reason ➔ Verify reason is displayed in the context menu on Home.

---

### 8. 📱 Minimalist Settings Screen
* **How to Trigger**: Tap Settings gear in top right of Home.
* **Sections**:
  1. **Appearance**: Theme (`Dark`/`Light`), Icon Style (`Standard`/`Monochrome`), Icon Sizing (`S`/`M`/`L`), Grid Columns (`3`/`4`/`5`), App Labels (`On`/`Off`).
  2. **Dock**: Max Dock Icons (`4`/`5`/`6`), Configure Dock Apps.
  3. **Productivity & Focus**: Daily Focus & Streaks switch, Auto-Arrange Non-Distractions button.
  4. **System & Recovery**: Set as Default Home, Accessibility Service, System Wallpaper.
* **Verification Checks**:
  - [ ] All settings changes persist across app restart (backed by MMKV storage).
