# De-Launcher

<p align="center">
  <strong>FOCUS • SIMPLIFIED</strong><br>
  <em>An intentional, distraction-free Android launcher built for mental clarity and digital wellbeing.</em>
</p>

<p align="center">
  <img src="assets/icon.png" width="128" height="128" alt="De-Launcher Icon" style="border-radius: 28px;" />
</p>

<p align="center">
  <a href="#core-brand-pillars">Pillars</a> •
  <a href="#key-features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a>
</p>

---

## Overview

**De-Launcher** is not just another customizable launcher—it is an **intentional focus tool**. Built with **React Native (Expo SDK 55)**, **TypeScript**, and **Kotlin Native Modules**, De-Launcher replaces dopamine-driven home screens with a stark, calm, distraction-free operating surface.

By pairing modern 120 FPS performance with psychological friction against mindless phone usage, De-Launcher helps you use your phone as a tool, accomplish your goals, and put it away.

---

## Core Brand Pillars

Every interaction, animation, and feature in De-Launcher conforms strictly to four governing principles:

| Pillar | Philosophy | Product Manifestation |
| :--- | :--- | :--- |
| **FOCUS** | *Brings attention to what matters.* | Intentional Pinning checkpoints, Daily Focus targets, Morning Intentions, and mindful pause cooldowns. |
| **MINIMAL** | *Clean design, zero distractions.* | Pure typography, OLED pitch-black default surface, zero unpolished emojis, and essential controls only. |
| **FORWARD** | *Designed to keep you moving ahead.* | 120 FPS snappy performance, seamless command search, helping you launch what you need and exit. |
| **ESSENTIAL** | *Only what you need, nothing more.* | Strict anti-bloat rule: rejecting gratuitous customization in favor of an opinionated, cohesive experience. |

---

## Key Features

### 🧠 Psychological Intentionality Engine
* **Intentional Pinning Checkpoint**: Adding an app to your Home screen or Dock requires writing an intentional reason why it belongs there. Features anti-copy-paste protection to prevent mindless pinning; your commitment is displayed directly on the app's context menu.
* **4-Step Mindful Opening Protocol (`intent-pause`)**: Opening distracting apps triggers a mindful gate requiring goal definition, session time limits (3m, 5m, 10m, 15m), and a 3-second breathing cooldown before launch.
* **Universal Mindful Gate**: Full protection across Home, Drawer, Search Command Bar, and Dock.

### 📱 Digital Wellbeing & Screen Time Awareness
* **Glanceable Screen Time Widget**: Minimalist card resting right below the clock providing real-time awareness of today's screen time, device unlock count, and goal progress.
* **Color-Coded Thresholds**: Adaptive progress indicators (Sage green `< 80%`, Amber warning `80–100%`, Coral red `> 100%`) keeping you mindful without loud alarms.
* **Interactive Wellbeing Sheet**: One tap reveals total offline/free hours, daily goal countdown, and top 5 apps today with relative usage proportions.
* **Wellbeing Streak Engine**: Rewards consistency by incrementing a daily streak whenever screen time stays within your goal at end-of-day.
* **System Integration**: Seamless one-tap deep link to native Android Digital Wellbeing settings.

### 🌅 Morning Focus Commitment Contract
* **Implementation Intentions**: Gentle bottom-sheet triggered on your first unlock of the day within your morning wake-up window.
* **Pre-Commitment**: Prompting you to declare your #1 focus priority for the day before notification noise takes over.
* **Zero-Distraction Rule**: Once dismissed or committed, it completely vanishes for the rest of the day until tomorrow morning.

### 🎯 Daily Focus & Consistency Heatmap
* **28-Day Consistency Heatmap**: A structured 4-week × 7-day calendar matrix tracking your daily focus task habit streak.
* **Interactive Task Checklist**: Add, toggle, and manage high-leverage daily priorities.
* **Smart Keyboard UX**: Fluid bottom sheet modal that dynamically resizes and smoothly scrolls task input cards directly into view above the software keyboard.

### ⚡ Fluid 120 FPS Experience
* **Adaptive App Grid**: Dynamic row height computation with stable row locking, icon size options (Small, Medium, Large), and frame-synchronized horizontal pagination.
* **OriginOS Minimal Page Indicator**: Clean page fraction indicator (`1/13`) without cluttered grab handles.
* **Capsule Dock**: Floating frosted glass dock with tactile physics and smooth reordering.
* **Universal Command Search**: Instant, zero-latency fuzzy search across apps, settings shortcuts, and system actions.

### 🎨 Design System & Visual Identity
* **Curated Palette**: Signature organic **Sage Green** (`#657D5C`) accents on solid OLED dark (`#000000` / `#121212`) surfaces.
* **Icon Theming**: Supports System Default, clean Monochrome tinting, and third-party Android icon packs (`appfilter.xml` parsing).
* **Pure Vector Icons**: Crisp Lucide vector badges replace unprofessional unicode emojis across the entire launcher.

### 🔒 Privacy & Battery-First Engineering
* **100% Offline**: No network tracking, no telemetry, no third-party analytics, and **ZERO ads**.
* **Instant Persistence**: Powered by ultra-fast native **MMKV** storage.
* **Efficient Native Modules**: Precision Android `UsageEvents` foreground tracking and accessibility monitoring with zero battery-draining loops.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [React Native 0.83](https://reactnative.dev/) with [Expo SDK 55](https://expo.dev/) |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) (Strict Mode) |
| **State Management** | [Zustand 5.0](https://github.com/pmndrs/zustand) with MMKV persistence |
| **Native Storage** | [react-native-mmkv 3.3](https://github.com/mrousavy/react-native-mmkv) |
| **Animations & Gestures** | [Reanimated 4.2](https://docs.swmansion.com/react-native-reanimated/) & [Gesture Handler 2.30](https://docs.swmansion.com/react-native-gesture-handler/) |
| **List Performance** | [@shopify/flash-list 2.0](https://shopify.github.io/flash-list/) |
| **Routing** | [Expo Router 55](https://docs.expo.dev/router/introduction/) (File-based) |
| **Native Module** | Custom Kotlin Module (`DeLauncherNativeModule`, `DistractionService`, `usagestats`) |
| **Icons & Typography** | [Lucide React Native](https://lucide.dev/), [@expo-google-fonts/inter](https://github.com/expo/google-fonts) |

---

## Architecture

```
.
├── app/                          # Expo Router file-based screens
│   ├── _layout.tsx              # Root app wrapper & intent listeners
│   ├── index.tsx                # Primary home screen
│   ├── drawer.tsx               # App drawer with search & filter
│   ├── settings.tsx             # Clean, intentional settings
│   ├── dock-settings.tsx        # Dock configuration
│   ├── intent-pause.tsx         # 4-Step Mindful Opening Protocol
│   └── onboarding/              # Multi-step welcome & permission setup
├── modules/de-launcher-native/   # Custom Kotlin Expo Native Module
│   ├── android/src/main/java/expo/modules/delaunchernative/
│   │   ├── DeLauncherNativeModule.kt   # App discovery, usage bridge, launching
│   │   ├── DistractionService.kt       # Accessibility service monitor
│   │   └── usagestats/                 # Precision foreground usage & screen time engine
│   └── src/                            # TypeScript native interfaces
├── src/
│   ├── components/              # 120 FPS UI components
│   │   ├── AppGrid.tsx          # Dynamic paginated app grid
│   │   ├── AppIcon.tsx          # Icon pack renderer & monochrome engine
│   │   ├── Clock.tsx            # Large typography clock
│   │   ├── ContextMenu.tsx      # Long-press actions & intentional pinning
│   │   ├── DailyFocusModal.tsx  # Heatmap sheet with keyboard auto-scroll
│   │   ├── Dock.tsx             # Floating frosted capsule dock
│   │   ├── HomeSearchWidget.tsx # Unified search bar
│   │   ├── MorningFocusPrompt.tsx # Once-daily intention sheet
│   │   ├── ScreenTimeWidget.tsx # Glanceable home screen time card
│   │   ├── ScreenTimeModal.tsx  # Digital wellbeing & app breakdown sheet
│   │   └── TodoStreakWidget.tsx # Daily focus & habit consistency widget
│   ├── services/appManager.ts   # Bridge service for native package management
│   ├── store/                   # Zustand stores (app, settings, todo, wellbeing)
│   └── theme/                   # Tokens, color palettes, and typography
└── assets/                      # Production icons & splashscreen assets
```

---

## Getting Started

### Prerequisites
* **Node.js** ≥ 18 and npm
* **Android SDK** & **Android Studio** (for local native builds)
* **JDK 17+**

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/NxAdx/De-Launcher.git
cd De-Launcher

# 2. Install dependencies
npm install

# 3. Type check & static analysis
npm run typecheck

# 4. Run on Android device or emulator with native module
npm run android
```

> **Note**: For native launcher features (home screen capture, `AccessibilityService`, `UsageStatsManager`, installed app discovery, and icon pack parsing), run via `npm run android` or an EAS build.

### Production Release Build

```bash
# Build production APK via EAS
npm run build:prod
```

---

## License

Private & Proprietary. All rights reserved © 2026 De-Launcher Team.
