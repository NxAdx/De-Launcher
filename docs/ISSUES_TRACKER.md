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
* **Root Cause (Deep Analysis)**:
  1. **RNGH Touch Interception**: The `GestureDetector` (with Pan gesture) wrapped a `<View>` covering the full screen. The Search & Settings buttons were rendered as a **sibling** View outside the GestureDetector, using absolute positioning and `pointerEvents="box-none"`. On Android, RNGH installs a native `onInterceptTouchEvent` handler that intercepts `ACTION_DOWN` events at a lower level than React Native's `pointerEvents` system, causing the Pan gesture system to consume touch starts before the overlay `Pressable` could register them.
  2. **HOME Intent Re-delivery**: When set as default launcher with `launchMode="singleTask"`, Android re-delivers the HOME intent via `onNewIntent()` in `MainActivity.kt`. The native debounce was only 500ms which could sometimes fire during in-progress navigation transitions, calling `router.dismissAll()` + `router.replace("/")` and cancelling the navigation to `/search` or `/settings`.
* **Resolution (v2 — Production Fix)**:
  1. **Moved buttons INSIDE the GestureDetector child View** in `app/index.tsx`. As children of the gesture-wrapped view, `Pressable` taps are dispatched by React Native's touch responder system BEFORE the Pan gesture activates (Pan requires `activeOffsetY: 35` — a 35px vertical drag). Taps (quick down/up) never reach the Pan activation threshold.
  2. **Increased native HOME debounce** in `MainActivity.kt` from 500ms to 1200ms to provide safe headroom for JS `signalNavigation(1000ms)` guard.

### ISSUE-02: Page Indicator Dots Overlapping App Labels
* **Symptoms**: In 4-row app grids, the pagination dots (`• • • • •`) rendered directly on top of the text labels of the bottom-most row of apps.
* **Resolution**: Removed `position: "absolute"` from `pageIndicator` in `src/components/AppGrid.tsx`. Placed the indicator in a dedicated footer container below the scrollable grid with explicit vertical padding, ensuring icons and dots occupy distinct vertical bands.

### ISSUE-03: App Icons Overflowing Under Dock During Focus Widget Expansion
* **Symptoms**: Expanding the Daily Focus widget pushes the app grid down so that the bottom rows of icons and page indicators are partially covered by or hidden beneath the bottom dock.
* **Root Cause**: `gridContainer` had a static `marginBottom` of `88px` which failed to account for Android's system navigation bar (`insets.bottom`). In addition, `AppGrid` hardcoded row height to 92px and rendered unlimited page indicator dots (e.g. 15 dots across the screen), causing dots and bottom icons to overflow behind the floating Dock.
* **Resolution**:
  1. Made `gridContainer` `marginBottom` dynamic: `layout.dockHeight + insets.bottom + spacing.xs` with `overflow: "hidden"`.
  2. Implemented dynamic `rowHeight` in `AppGrid.tsx` (`Math.min(BASE_ROW_HEIGHT, Math.floor(availableGridHeight / dynamicRows))`) ensuring icons are strictly bounded to the visible grid area.
  3. Added a smart sliding pagination window for `numPages > 6` displaying at most 6 dots centered on `activePage` with smoothly scaled edge dots.
  4. Streamlined expanded `TodoStreakWidget` padding and margins to preserve vertical screen real estate.

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

### ISSUE-09: Wrong Icon on Search / Recycled List Items (e.g. Canva showing Chalo icon)
* **Symptoms**: In Search results or App Drawer, searching for an app (e.g. "Canva") displayed the wrong app's icon (e.g. "Chalo").
* **Root Cause**: `AppIcon.tsx` stored `systemIcon` in a `useState` initializer that only ran on initial component mount. When `FlashList` recycled cells, the `app` prop changed, but `systemIcon` retained the previous item's icon URI and `useEffect` was skipped because `systemIcon` was already non-null.
* **Resolution**: Replaced unkeyed local state with synchronous cache resolution (`getCachedSystemIcon(app.packageName)` / `getCachedIcon(activeIconPack, app.packageName)`) and package-scoped async updates (`{ pkg: string, uri: string }`), ensuring recycled list items always render the exact matching icon for the current package.

### ISSUE-10: Cold Start Latency & Icon Extraction Throughput
* **Symptoms**: App took too long to load on startup; blank screen flash before apps appeared; icon generation was slow.
* **Root Cause**: `installedApps` was excluded from Zustand MMKV persistence, forcing cold boots to start with an empty app list until native queries resolved. Native icon extraction generated uncompressed 384x384 PNGs sequentially, and `IconPackParser` performed an O(N) full system scan of every package on the device.
* **Resolution**:
  1. Persisted `installedApps` in MMKV via `useAppStore` for instant frame-0 home screen rendering.
  2. Optimized native icon extraction size to 192px with `BufferedOutputStream` compression in `DeLauncherNativeModule.kt`.
  3. Replaced slow full-system package scan in `IconPackParser.kt` with instant indexed intent queries.

### ISSUE-11: 120Hz Display High Refresh Rate & Zero-Jank Rendering Optimization
* **Symptoms**: App felt locked to 60fps; swiping between pages had micro-stutters; local icon transitions caused GPU fill-rate spikes.
* **Root Cause**:
  1. Android window attributes did not request high refresh rate display modes (e.g. 90Hz/120Hz/144Hz) from the system compositor.
  2. `AppGrid.tsx` triggered React state updates (`setActivePage`) on every 16ms tick during active drag gestures.
  3. `AppIcon.tsx` configured `transition={100}` on `expo-image`, running 25-30 simultaneous alpha-blend animations every time icons mounted.
* **Resolution**:
  1. Implemented `enableHighRefreshRate()` in `MainActivity.kt` and `plugins/withLauncherIntent.js`, requesting the display's maximum available refresh rate mode (`preferredDisplayModeId`) for hardware 120Hz rendering.
  2. Enabled `android:hardwareAccelerated="true"` and `android:largeHeap="true"` in AndroidManifest.
  3. Throttled scroll handling with state guards (`setActivePage((prev) => (prev !== page ? page : prev))`), cutting JS bridge event traffic during swipe gestures by 4x.
  4. Configured `transition={0}`, `priority="high"`, and `recyclingKey` on `Image` in `AppIcon.tsx` for instantaneous zero-latency icon paints.

### ISSUE-12: Instant Frame-0 Icon Rendering (No Initial Fallback Initials)
* **Symptoms**: On cold boot, the launcher initially showed colorful circle avatars with letter initials before pop-in replacement with real app icons.
* **Root Cause**: `getInstalledApps()` in Kotlin previously hardcoded `"icon" to null`, relying on asynchronous `batchLoadSystemIcons()` after React render. In-memory `systemIconCache` was empty on launch, forcing `AppIcon` to fall back to initials on first paint.
* **Resolution**: Updated `getInstalledApps()` in `DeLauncherNativeModule.kt` and `appManager.ts` to directly resolve and return cached `file://` icon URIs on initial query. When `useAppStore` persists `installedApps` in MMKV, every app carries its real icon file path on frame 0, eliminating letter avatars and pop-in completely.

### ISSUE-13: Duplicate App Icons on Home Screen (Multi-Activity Deduplication)
* **Symptoms**: Certain apps (Amazon Pay, Authenticator, Canta, Calculator) appeared multiple times on the home screen.
* **Root Cause**: `LauncherApps.getActivityList()` returns all launcher activities per package. Apps with multiple entry points (e.g. Amazon shopping + Amazon Pay shortcut) produced duplicate package entries in `appList`.
* **Resolution**: Added package-level deduplication via `seenPackages` HashSet in `DeLauncherNativeModule.kt`, `appManager.ts`, and `appStore.ts`, guaranteeing each installed package appears exactly once.

### ISSUE-14: TodoStreakWidget Expansion Jumps & Glitches
* **Symptoms**: Tapping to expand the Daily Focus widget caused app grid icons to jump, clip, and temporarily glitch beneath the widget before settling.
* **Root Cause**: `TodoStreakWidget.tsx` called legacy `LayoutAnimation.configureNext()`. On Android, native view-level layout animation directly conflicts with Reanimated UI thread transform worklets in `AppGrid`, causing view bounds and transforms to fight during the 300ms transition.
* **Resolution**: Removed `LayoutAnimation.configureNext()`, letting Reanimated handle layout and fade transitions smoothly without disturbing native view frames.

### ISSUE-15: Frame-0 Dock Icon Layout Initialization
* **Symptoms**: On cold launch, the bottom dock was completely empty and icons popped in late.
* **Root Cause**: `Dock.tsx` initialized `dockWidth` to `0`, making `slotWidth` zero until `onLayout` fired asynchronously.
* **Resolution**: Initialized `dockWidth` directly from `useWindowDimensions().width`, ensuring `slotWidth > 0` on frame 0 and dock icons render immediately.

### ISSUE-16: OEM Smart Dock Auto-Detection & Zero-Flicker Diff Reconciliation
* **Symptoms**: On non-Pixel devices (Samsung, Vivo, Xiaomi, Oppo), the dock initialized empty because default Google package names did not exist. Background app scans triggered store re-renders causing home screen jump.
* **Root Cause**: Hardcoded `DEFAULT_DOCK_PACKAGES` assuming Pixel apps; `_layout.tsx` called `setInstalledApps()` unconditionally even if the installed app list had zero changes.
* **Resolution**: Inspired by Lawnchair, KISS, and Kvaesitso architecture:
  1. Implemented `resolveDefaultDockPackages()` in `appManager.ts` dynamically detecting the device's real Dialer, Messages, Browser, Camera, and Photos apps across all OEM brands.
  2. Implemented diff-checking before calling `setInstalledApps(apps)`, ensuring zero layout flashes or re-renders when nothing changed.
  3. Tied `SplashScreen.hideAsync()` to `isReady` so cold launches reveal the home screen only when it is 100% prepared with icons and dock.

### ISSUE-17: End-to-End Strict Package Deduplication (Grid, Dock & Home Memoization)
* **Symptoms**: Legacy MMKV store data with duplicate packages caused Amazon Pay, Authenticator, or Calculator to render twice on the home screen.
* **Root Cause**: `allowedPackages` array was mapped without an explicit uniqueness filter before passing to `AppGrid` and `Dock`.
* **Resolution**: Applied `Set<string>` deduplication guards in `app/index.tsx`, `Dock.tsx`, and `AppGrid.tsx`. Duplicate packages are filtered out at every rendering layer.

### ISSUE-18: Adaptive Grid Row Height Stability & Zero-Eviction Scaling
* **Symptoms**: Expanding the Daily Focus widget caused the bottom row of app icons to abruptly disappear and get pushed to Page 2.
* **Root Cause**: `AppGrid` calculated `dynamicRows = Math.floor(availableGridHeight / BASE_ROW_HEIGHT)` using fixed `88px`. A minor height reduction from 265px to 260px immediately halved available rows from 3 to 2, evicting 5 apps to Page 2.
* **Resolution**: Introduced `MIN_ROW_HEIGHT = 70px` for dynamic row calculation. When widgets expand, the grid maintains its 3-row layout and smoothly scales individual row heights from 88px to 78px without evicting any apps to another page.

### ISSUE-19: Synchronous Widget Expansion Coordination (Zero-Frame Layout Lag)
* **Symptoms**: Toggling the Daily Focus widget showed a 1-frame visual collision where row 3 overlapped the dock before snapping to its new position.
* **Root Cause**: `TodoStreakWidget` managed `isExpanded` locally, while `AppGrid` relied on asynchronous `onLayout` measurements. For 1-2 frames after expansion, `AppGrid` still rendered with the old 380px collapsed height before `onLayout` fired, rendering row 3 down into the dock.
* **Resolution**: Lifted `isTodoExpanded` to `HomeScreen` and passed it synchronously into both `TodoStreakWidget` and `AppGrid`. `AppGrid` adjusts its baseline height on the exact same render frame, eliminating layout lag and visual collisions.

### ISSUE-20: MMKV Hydration Duplicate Persistence (Canta×2, Canva×2 Still Present)
* **Symptoms**: Even after adding `Set<string>` in render code, duplicates persisted visually (Canta appeared twice, Canva appeared twice) across app restarts.
* **Root Cause**: The `allowedPackages` array stored in MMKV already contained duplicates from *before* the deduplication code was added. `setAppFocusState` used `.push()` without checking uniqueness. `setAllowedPackages` stored raw arrays. On MMKV hydration, Zustand loaded the stale duplicated array directly into state without sanitizing it.
* **Resolution** (Inspired by Kvaesitso's clean data model):
  1. Added `onRehydrateStorage` hook in Zustand persist config that force-deduplicates `allowedPackages` and `dockPackages` using `[...new Set()]` on every cold boot.
  2. Wrapped `setAllowedPackages` and `setAppFocusState` with `[...new Set()]` at the setter level so duplicates can never enter the store again.

### ISSUE-21: Widget Toggle Icon Shuffle (PAGE_SIZE Instability)
* **Symptoms**: Expanding Daily Focus caused page 1 to show completely different apps (Calendar→Chalo, Camera→ChatGPT). Collapsing restored the original set. Icons appeared to "shuffle" or "jump" between pages.
* **Root Cause**: `ROWS_PER_PAGE` was recalculated on every render from `Math.floor(availableGridHeight / 70)`. When the widget expanded, `measuredHeight` dropped from ~380px to ~240px, causing `dynamicRows` to drop from 3→2. This changed `PAGE_SIZE` from 15→10, causing `orderedItems.slice(0, PAGE_SIZE)` to show a completely different set of apps on page 1.
* **Resolution** (Inspired by Lawnchair's stable grid architecture):
  1. Introduced `lockedRowsRef` — a `useRef` that captures `ROWS_PER_PAGE` on the first valid `onLayout` measurement and never changes again.
  2. `PAGE_SIZE = gridColumns * lockedRows` stays constant across widget expansions. Only `rowHeight` adapts (compresses from 88px → 60px) to fit within the available space.
  3. Removed the `isTodoExpanded` effect that artificially overrode `measuredHeight`, which was fighting with `onLayout` and causing double state updates.

### ISSUE-22: Full-App 120 FPS Spring Physics & Jitter-Free Animation Architecture
* **Symptoms**: Animation transitions felt sluggish, micro-stuttered on high-refresh-rate displays (90Hz/120Hz), and expanding widgets suffered from mount/unmount layout jumps.
* **Root Cause**: Spring presets had low stiffness (180–280) and high mass (0.8–0.9), causing long settling times; `TodoStreakWidget` conditionally mounted/unmounted elements with `FadeIn/FadeOut` causing layout thrash; scroll throttles were set to `64ms` (4 frames behind at 60fps, 8 frames behind at 120fps); enter animations had arbitrary 150ms–200ms delay timers.
* **Resolution** (Inspired by Lawnchair & Kvaesitso animation architecture):
  1. Tuned all spring tokens in `tokens.ts` for 120Hz displays (`snappy`: stiffness 400, mass 0.4; `stiff`: stiffness 450, mass 0.4; `drag`: stiffness 500, mass 0.3).
  2. Converted `TodoStreakWidget` expansion to continuous `useAnimatedStyle` animating `maxHeight` and `opacity` together without unmounting.
  3. Removed enter delays across `AppGrid`, `Dock`, and `Drawer`, making all launcher transitions instant.
  4. Updated `scrollEventThrottle` to `16ms` for frame-synchronized page indicators and horizontal momentum physics.

### ISSUE-23: Official Brand Identity & Adaptive Icon Asset Integration
* **Symptoms**: App used generic Expo default placeholder icon grids on home screen, splash screen, and app drawer.
* **Root Cause**: Icon assets in `assets/` and `android/app/src/main/res/` were legacy scaffolding files.
* **Resolution**:
  1. Integrated the official De-Launcher brand mark (abstract D + focus leaf) from `docs/Icons/` into `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`, and `assets/favicon.png`.
  2. Generated complete multi-density Android mipmaps (`mipmap-mdpi` through `mipmap-xxxhdpi`) for standard and adaptive launcher foregrounds.
  3. Generated splashscreen drawables (`drawable-mdpi` through `drawable-xxxhdpi`).
  4. Updated `android/app/src/main/res/values/colors.xml` with `colorPrimary` set to brand sage green `#657D5C`.
  5. Integrated the logo into the Onboarding Welcome flow and Settings brand footer.

### ISSUE-24: Wallpaper Legibility, Frosted Cards & All Apps Dock Collision Fix
* **Symptoms**:
  1. Search & Settings buttons in top header, Search widget text, Daily Focus widget text, Clock date, and app labels were faint or invisible against bright photo wallpapers (e.g. snow mountains, skies).
  2. `All Apps` pill button rendered behind/underneath the floating Capsule Dock, causing a visual collision.
* **Root Cause**:
  1. Widgets and buttons used 3%–6% opacity backgrounds with `#666666`/`#9A9A9A` text and no text shadows, causing complete loss of contrast over wallpaper.
  2. `All Apps` was rendered outside `gridContainer` in `index.tsx` at the bottom of `contentArea`, overlapping the fixed `position: absolute` Dock.
* **Resolution**:
  1. Introduced `cardBg` (`rgba(18, 18, 18, 0.78)` dark / `rgba(255, 255, 255, 0.88)` light) and `cardBorder` (`rgba(255, 255, 255, 0.16)`) tokens across `HomeSearchWidget`, `TodoStreakWidget`, `AppGrid` footer, and top header `iconButton`s.
  2. Added pixel-perfect text shadows across `Clock`, `AppIcon` labels, and greeting text for legibility over any wallpaper (bright snow, sunset, dark photo).
  3. Moved `All Apps` pill button inside `AppGrid` footer directly above pagination dots, calculating proper available grid height so it never collides with the Dock.




