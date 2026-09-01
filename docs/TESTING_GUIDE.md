# 🧪 De-Launcher — Comprehensive Feature & Testing Guide

This guide walks you through testing every feature in **De-Launcher** (both newly introduced digital minimalism features and established core workflows).

---

## 📋 Feature Testing Checklist

- [ ] **1. Dopamine-Free Monochrome Icons**
- [ ] **2. Keyboard-Driven Instant Search Launch (KISS-style)**
- [ ] **3. Post-Session Goal Reflection Banner**
- [ ] **4. 4-Step Mindful Opening Protocol (Distraction Barrier)**
- [ ] **5. Intentional Pinning Checkpoint (Reason Required)**
- [ ] **6. Daily Focus & 28-Day Consistency Heatmap**
- [ ] **7. Frosted Capsule Dock & Drag-to-Reorder**
- [ ] **8. Cleaned-Up Minimalist Settings**

---

## 🔍 Step-by-Step Test Scenarios

### 1. 🖤 Dopamine-Free Monochrome Icons
* **Objective**: Remove dopamine triggers caused by saturated app icon colors (Instagram pink, YouTube red, TikTok neon).
* **Steps**:
  1. Open **Settings** (tap the gear icon in the top right of Home).
  2. Under **Appearance**, locate **Icon Style**.
  3. Tap **Monochrome**.
  4. Return to Home, open the App Drawer, and open Search.
  5. Verify all app icons are rendered in a sleek, desaturated grayscale palette.
  6. Return to Settings and switch back to **Standard** to verify instant toggle back to original colors.

---

### 2. ⌨️ Keyboard-Driven Instant Search Launch
* **Objective**: Search and launch apps with zero mouse/finger tapping from the keyboard (KISS Launcher pattern).
* **Steps**:
  1. From Home, swipe down from the center of the screen (or tap the Search pill).
  2. The keyboard opens automatically with cursor focused in the search input.
  3. Type 1–2 letters of an app (e.g. `ch` for Chrome, `ca` for Calculator, `se` for Settings).
  4. Notice the top matching result is highlighted at the top of the list.
  5. Tap the **Go / Search / Enter** key on your virtual keyboard.
  6. Verify the app launches immediately without requiring you to tap the list item.

---

### 3. 🎯 Post-Session Goal Reflection Banner
* **Objective**: Build meta-awareness and accountability for time spent inside distracting apps.
* **Steps**:
  1. Open a distracting app (e.g., Reddit, YouTube, Instagram) via Search or Drawer.
  2. Pass the Mindful Gate by entering a goal (e.g. *"Check work message"*), selecting 3 or 5 minutes, and completing the 3-second breathing cooldown.
  3. Use the app for a few moments, then press your Android Home button or gesture to return to De-Launcher.
  4. On the Home screen, verify the **Post-Session Reflection Card** appears:
     > *"Did you accomplish your goal? 'Check work message' in Reddit"*
  5. Test tapping **✅ Yes, done**:
     - Light haptic triggers, positive feedback *"Great focus! Goal logged"* displays, and card dismisses.
  6. Repeat with another session and tap **⚠️ Got distracted**:
     - Encouraging feedback *"Awareness is progress. Keep focused!"* displays and card dismisses.

---

### 4. 🛡️ 4-Step Mindful Opening Protocol (Distraction Gate)
* **Objective**: Prevent mindless impulsive app opening.
* **Steps**:
  1. Open Drawer and tap any distracting app (e.g., Instagram, YouTube, Reddit).
  2. Verify the **Mindful Gate** screen opens with a solid, deep OLED dark surface (zero background bleed-through from underlying screens).
  3. Try pasting text into the Goal field — verify paste is disabled to prevent mindless bypass.
  4. Type your intentional goal (minimum 8 characters).
  5. Select a time limit (`3 min`, `5 min`, `10 min`, `15 min`).
  6. Check the **Daily Focus Progress** acknowledgment.
  7. Tap **Unlock for X Minutes** ➔ Observe the 3-second pulsating breathing circle ➔ App launches smoothly.

---

### 5. 📌 Intentional Pinning Checkpoint (Home & Dock Curation)
* **Objective**: Keep the Home screen as a sacred, low-distraction space (Max 8–12 apps).
* **Steps**:
  1. Open the App Drawer (swipe up from Home).
  2. Long-press any app and tap **"Add to Home Screen (Requires Reason)"**.
  3. Verify the **Intentional Pin Modal** appears: *"Why does this app belong on your Home Screen?"*.
  4. Type a reason (min 10 chars) or tap an inspiration chip (e.g., *"Work communication"*).
  5. Tap **Pin to Home** ➔ App is added to Home.
  6. On Home, long-press the newly pinned app:
     - Verify the context menu header displays: *"📌 Pinned for: [Your Reason]"*.

---

### 6. 📊 Daily Focus & 28-Day Consistency Heatmap
* **Objective**: Anchor your day around 1–3 high-priority focus tasks.
* **Steps**:
  1. Look at the **DAILY FOCUS** widget pill in the center of Home.
  2. Tap the pill ➔ The **Daily Focus Bottom Sheet** slides up smoothly with background blur.
  3. Check the **28-Day Heatmap**:
     - 7-column × 4-row matrix representing the last 4 weeks of habit consistency.
     - Flame badge displaying your active streak.
  4. Add a new task using the **+ Add Task** input.
  5. Tap a task checkbox ➔ Watch it strike through with satisfying haptic feedback.
  6. Dismiss the sheet and observe the Home pill update in real-time (`1 / 2 completed today`).

---

### 7. 🧊 Permanent Frosted Dock & Drag-to-Reorder
* **Objective**: Ergonomic, one-handed dock with tactile drag-and-drop.
* **Steps**:
  1. Long-press an icon in the bottom Dock until it scales up slightly.
  2. Drag it horizontally left or right into a new slot.
  3. Release ➔ The icon snaps into place with smooth spring physics and haptics.
  4. Notice the frosted glass card design with high-contrast borders that stays legible across any wallpaper.

---

### 8. ⚙️ Cleaned-Up Minimalist Settings
* **Objective**: Eliminate the "tinkering trap" so settings remain simple and fast.
* **Steps**:
  1. Open **Settings**.
  2. Verify the 4 clean sections:
     - **Appearance**: Theme (Dark/Light), Icon Style (Standard/Monochrome), Icon Sizing (S/M/L), Grid Columns, App Labels.
     - **Dock**: Maximum Dock Icons (4–6), Configure Dock Apps.
     - **Productivity & Focus**: Daily Focus & Streaks toggle, Auto-Arrange Non-Distractions button.
     - **System & Recovery**: Set as Default Home, Accessibility Service, System Wallpaper.
  3. Verify no legacy icon pack dropdowns or cluttered animation sliders remain.
