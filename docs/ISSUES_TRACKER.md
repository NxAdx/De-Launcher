# De-Launcher Issue & Improvement Tracker

This document tracks all reported issues, technical root causes, implementation fixes, and verification states for the De-Launcher project.

---

## Active Issues & Status Matrix

| ID | Issue Description | Root Cause | Status | Fixed In |
| :--- | :--- | :--- | :--- | :--- |
| **ISSUE-01** | Search & Settings top buttons not responding on default home | `headerBar` was placed before `<GestureDetector>` in JSX; Android Pan recognizer intercepted touch events. | ✅ Fixed (Awaiting User Test) | `app/index.tsx` |
| **ISSUE-02** | Page indicator dots overlap and clash with bottom app icons/labels | `pageIndicator` was positioned absolutely over the bottom row (`position: "absolute", bottom: spacing.xxs`). | ✅ Fixed (Awaiting User Test) | `src/components/AppGrid.tsx` |
| **ISSUE-03** | Icons fall under dock when Daily Focus is expanded | Grid rows were hardcoded to 4 (`4 * 92 = 368px`) regardless of available height after Clock, Search, and Expanded Daily Focus. | ✅ Fixed (Awaiting User Test) | `src/components/AppGrid.tsx`, `app/index.tsx` |
| **ISSUE-04** | Dock background naming and shape (sometimes looks rectangular) | Strings contained "Vivo-style". `dockCard` lacked `overflow: 'hidden'` when not frosted, causing Android elevation/shadow to render square corners in some states. | ✅ Fixed (Awaiting User Test) | `src/components/Dock.tsx`, `app/settings.tsx` |
| **ISSUE-05** | Theme is locked to "OLED Pure Dark" and Light mode toggle is a no-op | `ThemeContext.tsx` hardcoded `const mode = "dark"` and `toggleTheme` was a dummy function. | ✅ Fixed (Awaiting User Test) | `src/theme/ThemeContext.tsx`, `src/theme/tokens.ts`, `app/settings.tsx` |
| **ISSUE-06** | Custom icons section needs a clean dropdown with Default (System) option | Settings listed raw detected icon packs without a unified dropdown and without a visible "System Default" selectable state. | ✅ Fixed (Awaiting User Test) | `app/settings.tsx` |
| **ISSUE-07** | Settings toggles and rows feel stuck / lack smooth feedback | `SettingRow` wrapped all rows in an active `Pressable` even when `onPress` was undefined, creating touch responder conflicts with nested switches. | ✅ Fixed (Awaiting User Test) | `app/settings.tsx` |
| **ISSUE-08** | Daily Focus tasks don't show ticked until collapsed and re-expanded | `TodoStreakWidget.tsx` selected `(s) => s.getTodayTodos` (a function reference) instead of subscribing to `state.todos`, so Zustand skipped re-rendering on task mutations. | ✅ Fixed (Awaiting User Test) | `src/components/TodoStreakWidget.tsx` |

---

## Detailed Issue Breakdown & Resolutions

### ISSUE-01: Top Action Buttons (Search & Settings) Unresponsive
* **Symptoms**: Tapping Search (magnifying glass) or Settings (gear icon) on the top right does not open the respective screens when De-Launcher is set as the default launcher.
* **Resolution**: Reordered the JSX hierarchy in `app/index.tsx` to render `headerBar` as the top-level overlay AFTER `<GestureDetector>`, with `pointerEvents="box-none"` on the container and `hitSlop={16}` on the buttons.

### ISSUE-02: Page Indicator Dots Overlapping App Labels
* **Symptoms**: In 4-row app grids, the pagination dots (`• • • • •`) rendered directly on top of the text labels of the bottom-most row of apps.
* **Resolution**: Removed `position: "absolute"` from `pageIndicator` in `src/components/AppGrid.tsx`. Placed the indicator in a dedicated footer container below the scrollable grid with explicit vertical padding, ensuring icons and dots occupy distinct vertical bands.

### ISSUE-03: App Icons Overflowing Under Dock During Focus Widget Expansion
* **Symptoms**: Expanding the Daily Focus widget pushes the app grid down so that the bottom rows of icons are partially covered by or hidden beneath the bottom dock.
* **Resolution**: Implemented dynamic row calculation in `src/components/AppGrid.tsx`. `ROWS_PER_PAGE` is calculated based on measured `gridHeight`: `Math.max(1, Math.min(4, Math.floor(availableGridHeight / ROW_HEIGHT)))`. When the focus widget expands, the grid gracefully switches to 2 or 3 rows per page with automatic pagination.

### ISSUE-04: Dock Styling & Brand Name Cleanup
* **Symptoms**: Dock description used "Vivo-style" in Settings and the dock card occasionally rendered with square corners on Android.
* **Resolution**: Replaced all brand names with professional terms ("Frosted Translucent" / "Transparent Clean"). Enforced `overflow: "hidden"`, explicit `borderRadius: 28`, and unified background/border tokens directly on `dockCard`.

### ISSUE-05: Real Theme Switching (Dark & Light)
* **Symptoms**: Theme setting was labeled "OLED Pure Dark", light mode toggle did nothing, and `ThemeProvider` permanently hardcoded dark mode.
* **Resolution**: Connected `ThemeProvider` in `src/theme/ThemeContext.tsx` to `useSettingsStore((s) => s.theme)`. Added reactive theme switching with refined light/dark color tokens.

### ISSUE-06: Icon Pack Selector with System Default
* **Symptoms**: Settings showed raw detected icon packs or an empty state without an option to explicitly select or return to System Default icons.
* **Resolution**: Built an interactive dropdown selector in `app/settings.tsx` displaying the current active icon pack and a selectable list featuring `Default (System Icons)` alongside any installed packs.

### ISSUE-07: Settings Toggle Responsiveness & Touch Optimization
* **Symptoms**: Toggles and rows in Settings felt laggy, unresponsive, or captured gestures incorrectly.
* **Resolution**: Conditionalized touch wrappers in `SettingRow` so rows without custom `onPress` actions pass touches directly to nested `Switch` and segment button components without responder conflict.

### ISSUE-08: Daily Focus Reactive Task Checking & Animations
* **Symptoms**: Checking off a task in the Daily Focus widget did not show the checkmark or strikethrough until the widget was collapsed and re-opened.
* **Resolution**: Fixed the Zustand selector in `src/components/TodoStreakWidget.tsx` to subscribe directly to `useTodoStore((s) => s.todos)` and `history`, triggering immediate UI re-renders with animated checkmarks, strikethrough text, and updated streak counts.
