# De-Launcher — Intentional Minimalism for Android

A distraction-free, privacy-focused Android launcher built with **React Native**, **Expo**, and **Kotlin**. De-Launcher helps you focus by restricting your device to only the apps you choose, with a stark, typography-first interface.

## Development Status

Current status: **functional prototype / early native integration**.

What is working now:
- Expo Router app shell with home, drawer, and settings screens.
- Zustand + MMKV-backed settings, whitelist, and dock state.
- Android native module code for installed-app discovery, app launching, whitelist sync, icon-pack discovery, and the accessibility service.
- Expo Go preview mode with a safe demo app list when the local native module is unavailable.
- TypeScript and lint checks pass with `npm test`.

What still needs device-build validation:
- Setting De-Launcher as the Android home app.
- Accessibility-service enforcement against non-whitelisted apps.
- Full icon-pack drawable mapping across real icon packs.
- Widget binding flow. The native view/host plumbing exists, but widget selection/binding still needs completion.

Important: **Expo Go can preview the React Native interface only.** Local Expo native modules are not bundled in Expo Go, so launcher, accessibility, widget, and PackageManager features require `npm run android`, an EAS development build, or a production APK.

## Features

✨ **Core Functionality**
- **Custom Home Launcher** — Becomes your device's default home screen
- **App Whitelist** — Only allowed apps can launch; attempts to open others are blocked
- **Accessibility Service** — Monitors foreground app changes and enforces whitelist in real-time
- **Productivity Dock** — Fixed bottom dock for your 5 most-used apps
- **Grid View** — Clean, customizable grid display of allowed apps (3, 4, or 5 columns)

🎨 **Customization**
- **Theme Support** — Dark (OLED-optimized) and light modes
- **Icon Packs** — Full support for custom Android icon packs (appfilter.xml parsing)
- **Font Selection** — Multiple typography options via Inter font family
- **Dynamic Grid** — Adjust columns, labels, and spacing on-the-fly

🔧 **Advanced Features**
- **Widget Hosting** — Support for Android widgets on the homescreen (AppWidgetHost)
- **Haptic Feedback** — Optional vibration on interactions
- **Persistent State** — Ultra-fast MMKV-based storage for instant app list and settings
- **Native Integration** — Kotlin modules for PackageManager, AccessibilityService, and widget hosting

## Tech Stack

- **Framework**: React Native 0.81 with Expo SDK 54
- **Language**: TypeScript 5.9 (strict mode)
- **State Management**: Zustand 5.0 + React Context
- **Persistence**: react-native-mmkv 4.3 (synchronous, high-performance KV storage)
- **UI Animations**: Reanimated 4.1, Gesture Handler 2.28
- **Navigation**: Expo Router 6.0
- **Native Modules**: Expo Modules + Custom Kotlin code
- **Icons**: Lucide React Native, Expo Vector Icons
- **Lists**: FlashList 2.0 (performant rendering)

## Architecture

### Folder Structure

```
.
├── app/                          # Expo Router screens (file-based routing)
│   ├── _layout.tsx              # Root layout with app initialization
│   ├── index.tsx                # Homescreen
│   ├── drawer.tsx               # Full app drawer (modal)
│   └── settings.tsx             # Settings and customization
├── modules/de-launcher-native/   # Expo Native Module
│   ├── src/                     # TypeScript declarations and wrappers
│   ├── android/                 # Kotlin implementation
│   │   ├── src/main/java/expo/modules/delaunchernative/
│   │   │   ├── DeLauncherNativeModule.kt        # Module definition
│   │   │   ├── DistractionService.kt            # AccessibilityService
│   │   │   ├── WidgetHostView.kt                # Widget hosting
│   │   │   └── IconPackParser.kt                # Icon pack discovery & parsing
│   │   └── src/main/res/
│   │       ├── xml/accessibility_service_config.xml
│   │       └── values/strings.xml
│   └── expo-module.config.json  # Module configuration
├── src/
│   ├── components/              # Reusable React Native components
│   │   ├── AppIcon.tsx          # Single app icon with custom icon pack support
│   │   ├── AppGrid.tsx          # Grid layout for apps
│   │   ├── Clock.tsx            # Minimal clock widget
│   │   ├── Dock.tsx             # Bottom dock for quick access
│   │   ├── SearchBar.tsx        # App search (optional)
│   │   └── WidgetHost.tsx       # Widget integration
│   ├── services/
│   │   └── appManager.ts        # App launching, icon pack, and distraction management
│   ├── store/                   # Zustand state management
│   │   ├── appStore.ts          # Installed apps, whitelist, dock
│   │   ├── settingsStore.ts     # Theme, grid, labels, icon pack preference
│   │   └── storage.ts           # MMKV storage adapter
│   ├── theme/
│   │   ├── ThemeContext.tsx     # Theme provider and hooks
│   │   └── tokens.ts            # Design tokens (colors, typography, spacing)
│   └── types/
│       └── app.ts               # TypeScript interfaces
├── plugins/
│   └── withLauncherIntent.js    # Expo Config Plugin for manifest modifications
├── app.json                     # Expo app configuration
├── eas.json                     # EAS Build configuration
└── tsconfig.json                # TypeScript configuration
```

### Data Flow

```
User Interaction (tap app icon)
         ↓
AppIcon Component → onPress callback
         ↓
launchApp(packageName) [appManager.ts]
         ↓
DeLauncherNativeModule.launchApp() [Kotlin]
         ↓
PackageManager.getLaunchIntentForPackage()
         ↓
context.startActivity(intent)
         ↓
App launches successfully
         ↓
If app NOT in whitelist:
  DistractionService detects window change
  → performGlobalAction(GLOBAL_ACTION_HOME)
  → user forced back to launcher
```

### State Management

**Zustand Stores** (MMKV-persisted):

1. **appStore** — Installed apps, allowed packages, dock configuration
   - `installedApps: AppInfo[]` — All device apps
   - `allowedPackages: string[]` — Whitelisted package names
   - `dockPackages: string[]` — Dock app order (max 5)
   - Actions: `toggleAppAllowed()`, `addToDock()`, `reorderDock()`

2. **settingsStore** — User preferences
   - `theme: "dark" | "light"`
   - `gridColumns: 3 | 4 | 5`
   - `showLabels: boolean`
   - `showClock: boolean`
   - `hapticFeedback: boolean`
   - `activeIconPack: string | null` — Package name of selected icon pack

**Persistence**: All state auto-saved to MMKV (SharedPreferences on Android).

### Native Module Bridge

The custom Expo module (`DeLauncherNativeModule`) exposes:

**App Management**:
- `getInstalledApps(): Promise<AppInfo[]>`
- `launchApp(packageName: string): Promise<void>`
- `updateWhitelist(packages: string[]): Promise<void>`

**Icon Packs**:
- `getAvailableIconPacks(): Promise<IconPackInfo[]>`
- `getIconFromPack(package: string, drawable: string): Promise<string | null>`

**Widgets**:
- `allocateAppWidgetId(): Promise<number>`
- `startWidgetBindFlow(id: number): Promise<number>`

**Distraction Engine**:
- `DistractionService` (AccessibilityService) — Runs in background, monitors foreground app changes
- Queries whitelist from SharedPreferences
- Blocks non-allowed apps by forcing return to home

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 and npm/yarn
- **Expo CLI**: `npm install -g expo-cli`
- **Android SDK** (for building/running on Android)
- **Java Development Kit** (JDK 17+)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd De-Launcher

# Install dependencies
npm install

# Install iOS pods (optional, for iOS development)
cd ios && pod install && cd ..
```

### Development

```bash
# Start Expo development server for Expo Go UI preview
npm start

# Run on Android emulator/device with the native launcher module
npm run android

# Run on iOS (requires macOS)
npm run ios

# Run web version (limited functionality)
npm run web

# Type check and lint
npm test
```

### Building for Production

```bash
# Clean prebuild to ensure native modules are rebuilt
npx expo prebuild --clean

# Build development APK
npm run build:dev

# Build preview APK (test build)
npm run build:preview

# Build production APK
npm run build:prod
```

Builds are managed via **EAS Build** (Expo's managed build service). Configure `eas.json` before building.

## Configuration

### Setting De-Launcher as Default Home

1. Long-press your device home screen
2. Select "Home Settings" or "Set as Home"
3. Choose "De-Launcher"
4. De-Launcher becomes your new home launcher

### Enabling Accessibility Service

The **Distraction Engine** requires accessibility service permission:

1. Open **Settings** > **Accessibility**
2. Find "De-Launcher Distraction Engine"
3. Toggle **On**
4. Grant permission when prompted

This allows De-Launcher to detect and block non-whitelisted apps.

## API Reference

### appManager Service

```typescript
// Fetch all installed apps from device
getInstalledApps(): Promise<AppInfo[]>

// Launch an app by package name
launchApp(packageName: string): Promise<void>

// Get available icon packs installed on device
getAvailableIconPacks(): Promise<IconPackInfo[]>

// Get custom icon from a pack
getIconFromPack(
  iconPackPackage: string,
  drawableName: string
): Promise<string | null>
```

### AppStore

```typescript
// Set all installed apps
setInstalledApps(apps: AppInfo[]): void

// Add/remove app from whitelist
toggleAppAllowed(packageName: string): void

// Add app to dock
addToDock(packageName: string): void

// Reorder dock
reorderDock(packages: string[]): void

// Get only allowed apps
getAllowedApps(): AppInfo[]

// Get dock apps
getDockApps(): AppInfo[]
```

### SettingsStore

```typescript
// Update theme
setTheme(theme: "dark" | "light"): void

// Update grid columns
setGridColumns(cols: 3 | 4 | 5): void

// Toggle labels, clock, haptics
setShowLabels(show: boolean): void
setShowClock(show: boolean): void
setHapticFeedback(enabled: boolean): void

// Set active icon pack
setActiveIconPack(packageName: string | null): void
```

## Advanced Usage

### Custom Icon Pack Integration

1. **Icon Pack Apps** should follow Android's icon pack standard:
   - Provide an `appfilter.xml` in `res/xml/`
   - Define mappings: `<item component="com.example.app/.MainActivity" drawable="custom_icon" />`

2. **De-Launcher** automatically discovers and parses icon packs
3. Users can select from **Settings** > **APPEARANCE** > **Icon Packs**
4. Icons resolve dynamically when loading apps

### Adding Widgets

1. Open **Settings** (swipe down or gear icon)
2. Tap **"Add Widget"** (future implementation)
3. Select widget from allowed apps
4. Widget appears on homescreen

### Programmatic Whitelist Management

```typescript
import { useAppStore } from '@/src/store/appStore';

const App = () => {
  const { toggleAppAllowed, setAllowedPackages } = useAppStore();

  const blockApp = (pkg: string) => {
    toggleAppAllowed(pkg);
  };

  const setWhitelist = (packages: string[]) => {
    setAllowedPackages(packages);
  };

  // ...
};
```

## Performance Optimizations

✅ **FlashList** — O(1) rendering for 1000+ apps (vs FlatList's O(n))
✅ **MMKV Storage** — Synchronous, <1ms persistence
✅ **Reanimated 4** — GPU-accelerated animations
✅ **React 19** — Automatic batching, optimized renders
✅ **Type Safety** — Strict TypeScript prevents runtime errors

## Security & Privacy

🔒 **No Cloud Sync** — All data stays on device
🔒 **No Tracking** — No analytics or telemetry
🔒 **No Permissions** — Only requests necessary Android permissions:
  - `QUERY_ALL_PACKAGES` — List installed apps
  - `BIND_ACCESSIBILITY_SERVICE` — Monitor app launches
  - `BIND_APPWIDGET` — Host widgets

🔒 **Open Source** — Fully auditable code

## Troubleshooting

### Apps Still Opening (Distraction Engine Not Working)

**Solution**: 
1. Check that Accessibility Service is enabled (Settings > Accessibility)
2. Force-stop De-Launcher and re-enable in Accessibility settings
3. Restart device

### Custom Icon Pack Icons Not Showing

**Solution**:
1. Verify icon pack is installed and discoverable
2. Check icon pack's `appfilter.xml` format
3. Try default icons and re-select icon pack

### Performance Issues with Large App Lists

**Solution**:
1. Use FlashList (already integrated)
2. Reduce grid columns to 3 for faster rendering
3. Disable app labels if not needed

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m 'Add my feature'`)
4. Push to branch (`git push origin feature/my-feature`)
5. Open a Pull Request

### Development Guidelines

- **TypeScript**: Strict mode required, no `any` types
- **Code Style**: Keep `npm test` passing before handing off changes
- **Testing**: Write tests for new features (Jest + React Native Testing Library)
- **Commits**: Clear, descriptive commit messages
- **Documentation**: Update README and comments for public APIs

## Roadmap

**Phase 1** (Functional prototype)
- [x] Core launcher UI and navigation
- [x] App discovery and whitelisting
- [ ] Device-validated distraction blocking via AccessibilityService
- [ ] Device-validated custom icon pack support
- [x] Settings and customization

**Phase 2** (In Progress)
- [ ] Widget hosting and management UI
- [ ] Advanced distraction rules (time-based, app-specific)
- [ ] Per-app permissions
- [ ] Usage analytics (local only)

**Phase 3** (Future)
- [ ] Multi-profile support
- [ ] Shortcut tiles
- [ ] Advanced automation
- [ ] Cloud sync (opt-in, end-to-end encrypted)

## License

MIT License — See LICENSE file for details.

## Support

For issues, questions, or feature requests:
- **GitHub Issues**: [de-launcher/issues](https://github.com/your-repo/issues)
- **Discussions**: [de-launcher/discussions](https://github.com/your-repo/discussions)
- **Email**: support@de-launcher.io (future)

## Credits

Built with ❤️ using:
- [Expo](https://expo.dev) — Best-in-class React Native platform
- [React Native](https://reactnative.dev) — Cross-platform mobile framework
- [Zustand](https://github.com/pmndrs/zustand) — Lightweight state management
- [Reanimated](https://docs.swmansion.com/react-native-reanimated) — GPU-accelerated animations
- [Android Developer Documentation](https://developer.android.com) — Platform APIs

---

**De-Launcher**: Intentional Minimalism for Android. Focus on what matters.
