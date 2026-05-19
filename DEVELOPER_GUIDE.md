# De-Launcher Developer Guide

Welcome to De-Launcher development! This guide helps you set up, understand, and contribute to the project.

## Quick Start

### Prerequisites

- **Node.js** ≥ 18 (recommended: 20 LTS)
- **npm** or **yarn** (npm included with Node.js)
- **Expo CLI**: `npm install -g expo-cli`
- **Android SDK**: Via Android Studio or cmdline-tools
  - SDK Platform 34 (target API level)
  - Build Tools 34.0.0
  - NDK (for native modules)
- **Java Development Kit** 17+ (OpenJDK or Oracle)
- **Git**

### Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/de-launcher.git
cd De-Launcher

# 2. Install Node dependencies
npm install

# 3. (Optional) Install iOS pods
cd ios && pod install && cd ..

# 4. Start Expo development server for Expo Go UI preview
npm start

# 5. Run on Android when testing native launcher features
npm run android
```

After first build, the Expo development server will continue running. You can:
- Press `i` for iOS simulator
- Press `a` for Android emulator when using Expo Go-compatible JS only
- Press `w` for web
- Scan QR code with Expo Go app on a real device

### Expo Go vs Development Build

Use Expo Go first for UI and navigation checks. The project includes a JavaScript fallback dataset so the home screen and app drawer are usable without the local native module.

Use an Android development build (`npm run android` or `npm run build:dev`) for:
- Installed app discovery through PackageManager
- Launching apps by package name
- Whitelist syncing to native SharedPreferences
- Accessibility-service distraction blocking
- Icon-pack discovery and widget hosting

## Project Structure Deep Dive

### Frontend (`/app` and `/src`)

**Screens** (`/app` — Expo Router):
- `_layout.tsx` — Root layout, app initialization, font loading
- `index.tsx` — Homescreen (main UI)
- `drawer.tsx` — Full app drawer modal
- `settings.tsx` — Settings and customization

**Components** (`/src/components`):
- `AppIcon.tsx` — Single app icon component with icon pack support
- `AppGrid.tsx` — Grid layout for apps (uses FlashList)
- `Clock.tsx` — Minimal clock widget
- `Dock.tsx` — Bottom dock with max 5 apps
- `SearchBar.tsx` — App search (optional feature)
- `WidgetHost.tsx` — Android widget integration wrapper

**State Management** (`/src/store`):
- `appStore.ts` — Zustand store for apps, whitelist, dock
- `settingsStore.ts` — User preferences (theme, grid, icon pack)
- `storage.ts` — MMKV storage adapter for Zustand

**Services** (`/src/services`):
- `appManager.ts` — Abstractions over native module (launching, icon packs, etc.)

**Theme** (`/src/theme`):
- `ThemeContext.tsx` — Theme provider and useTheme hook
- `tokens.ts` — Design tokens (colors, typography, spacing, layout constants)

**Types** (`/src/types`):
- `app.ts` — TypeScript interfaces for AppInfo, etc.

### Native Module (`/modules/de-launcher-native`)

**TypeScript Declarations** (`/modules/de-launcher-native/src`):
- `DeLauncherNativeModule.ts` — Module class declaration
- `DeLauncherNative.types.ts` — Event and prop types
- `DeLauncherNativeModule.web.ts` — Web fallback
- `DeLauncherNativeView.tsx` — React component for native view

**Kotlin Implementation** (`/modules/de-launcher-native/android/src/main/java`):
- `DeLauncherNativeModule.kt` — Main module definition with AsyncFunctions
- `DistractionService.kt` — AccessibilityService (core of distraction engine)
- `WidgetHostView.kt` — FrameLayout wrapper for AppWidgetHost
- `IconPackParser.kt` — Discovers and parses icon pack APKs

**Resources** (`/modules/de-launcher-native/android/src/main/res`):
- `xml/accessibility_service_config.xml` — AccessibilityService configuration
- `values/strings.xml` — String resources

**Configuration**:
- `expo-module.config.json` — Module metadata and build config
- `build.gradle` — Gradle build configuration

### Plugins (`/plugins`)

- `withLauncherIntent.js` — Expo Config Plugin that:
  - Adds HOME and DEFAULT intent categories (makes launcher selectable)
  - Registers DistractionService in AndroidManifest.xml
  - Adds required permissions

### Config Files (Root)

- `app.json` — Expo app configuration (name, version, plugins, etc.)
- `eas.json` — EAS Build profiles (dev, preview, production)
- `tsconfig.json` — TypeScript strict mode configuration
- `babel.config.js` — Babel preset for Expo
- `package.json` — Dependencies and npm scripts
- `.github/workflows/ci-cd.yml` — GitHub Actions CI/CD pipeline

## Development Workflows

### Adding a New Component

```typescript
// 1. Create component file
// src/components/MyComponent.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing } from '@/src/theme/tokens';

interface MyComponentProps {
  // Define props
}

export function MyComponent(props: MyComponentProps) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Component content */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
});

// 2. Export from src/components/index.ts (create if needed)
export { MyComponent } from './MyComponent';

// 3. Use in screen or other component
import { MyComponent } from '@/src/components';
```

### Adding a New Store

```typescript
// src/store/myStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './storage';

interface MyState {
  // State properties
  myValue: string;
  
  // Actions
  setMyValue: (value: string) => void;
}

export const useMyStore = create<MyState>()(
  persist(
    (set) => ({
      // Initial state
      myValue: 'default',
      
      // Actions
      setMyValue: (myValue) => set({ myValue }),
    }),
    {
      name: 'my-store', // Key for MMKV storage
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

### Adding a Native Module Function

**Step 1: Update Kotlin**
```kotlin
// DeLauncherNativeModule.kt
override fun definition() = ModuleDefinition {
  Name("DeLauncherNative")

  AsyncFunction("myNewFunction") { param: String ->
    // Implementation
    return@AsyncFunction "result"
  }
}
```

**Step 2: Update TypeScript Declaration**
```typescript
// DeLauncherNativeModule.ts
declare class DeLauncherNativeModule extends NativeModule<...> {
  myNewFunction(param: string): Promise<string>;
}
```

**Step 3: Export from index.ts**
```typescript
// index.ts
export async function myNewFunction(param: string): Promise<string> {
  return await DeLauncherNativeModule.myNewFunction(param);
}
```

**Step 4: Use in service/component**
```typescript
import { myNewFunction } from '@/modules/de-launcher-native';

const result = await myNewFunction('param');
```

### Testing Accessibility Service

1. Enable in Settings > Accessibility > De-Launcher Distraction Engine
2. Whitelist a few apps in Settings
3. Try launching an app not in the whitelist — you should be forced back to home
4. Check logcat for debug logs:
   ```bash
   adb logcat | grep DistractionService
   ```

### Testing Icon Packs

1. Install a third-party icon pack (e.g., Oxy, Nova, etc.)
2. Open De-Launcher Settings
3. Should see the icon pack listed under icon packs
4. Select it to activate
5. App icons should update (if the icon pack has mappings)

### Building for Distribution

```bash
# Development build (for testing)
npm run build:dev

# Preview build (for client/testers)
npm run build:preview

# Production build
npm run build:prod
```

Builds are managed via **EAS Build**. Configure in `eas.json` and authenticate:
```bash
eas login
eas build --platform android --profile production
```

## Code Style & Standards

### TypeScript

- **Strict mode required** — `tsconfig.json` has `strict: true`
- **No `any` types** — Use proper types or `unknown`
- **Export types explicitly** — `export type X = ...` or `export interface Y { ... }`

```typescript
// ✅ Good
interface AppInfo {
  packageName: string;
  label: string;
}

function getApp(id: string): AppInfo | null {
  // ...
}

// ❌ Avoid
function getApp(id: any): any {
  // ...
}
```

### React / React Native

- **Functional components only** — No class components
- **Use hooks** — useState, useCallback, useMemo, useEffect
- **Memoize callbacks** — useCallback for props passed to children
- **Fragment usage** — Use `<>...</>` for wrapping adjacent elements

```typescript
// ✅ Good
const MyComponent = () => {
  const [count, setCount] = useState(0);
  
  const handleIncrement = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  return <Button onPress={handleIncrement} />;
};

// ❌ Avoid
const MyComponent = function() {
  // ...
};
```

### Naming Conventions

- **Components**: PascalCase (`MyComponent`, `AppIcon`)
- **Functions/variables**: camelCase (`getApps`, `isAllowed`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_DOCK_APPS`, `DEFAULT_THEME`)
- **Types/Interfaces**: PascalCase (`AppInfo`, `SettingsState`)
- **File names**: Match export (PascalCase for components, camelCase for utilities)

### Comments

- Use JSDoc for public APIs
- Single-line comments for non-obvious logic
- No commented-out code — use git history instead

```typescript
/**
 * Get all installed apps from the device.
 * @returns Array of app info sorted alphabetically
 */
export async function getInstalledApps(): Promise<AppInfo[]> {
  // ...
}
```

## Debugging

### React Developer Tools

```bash
npm start
# Expo will provide a menu to open DevTools
```

### Android Logcat

```bash
# View all logs
adb logcat

# Filter by package
adb logcat | grep de.launcher

# Filter by tag
adb logcat | grep DistractionService

# Clear logcat
adb logcat -c
```

### React Native Debugger

```bash
# Install globally
npm install -g react-native-debugger

# Open it and configure port 19000 or 19001
react-native-debugger
```

### Kotlin Debugging

1. In Android Studio: `File` > `Open` > `android` folder
2. Set breakpoints in Kotlin code
3. Run with debugging: `npm run android -- --variant=debug`

## Common Issues & Solutions

### "Type 'X' has no properties in common with type 'Y'"

**Cause**: TypeScript type mismatch
**Solution**: Check imports, ensure types match exactly

```typescript
// ❌ Wrong
const app: AppInfo = { /* ... */ };

// ✅ Correct
import { AppInfo } from '@/src/types/app';
const app: AppInfo = { /* ... */ };
```

### "Native module not found"

**Cause**: Native module not properly linked
**Solution**: Rebuild and clear cache
```bash
npx expo prebuild --clean
npm run android
```

### MMKV not persisting

**Cause**: Store not properly configured
**Solution**: Ensure persist middleware is applied and storage adapter used
```typescript
export const useMyStore = create<MyState>()(
  persist(
    (set) => ({ /* ... */ }),
    { storage: createJSONStorage(() => mmkvStorage) } // ← Required
  )
);
```

### Icon pack icons not showing

**Cause**: Icon pack doesn't have appfilter.xml or drawable name mismatch
**Solution**: 
1. Verify icon pack is properly installed
2. Check drawable naming convention in icon pack
3. Implement proper drawable name resolution in AppIcon.tsx

## Performance Tips

1. **Memoize expensive renders** — Use `React.memo()` for list items
2. **Use FlashList** — Already integrated for O(1) app list rendering
3. **Optimize images** — MMKV already stores small Base64 icons efficiently
4. **Batch state updates** — React 19 does this automatically
5. **Avoid unnecessary re-renders** — Use useCallback and useMemo

## Testing

### Unit Tests (Jest)

```bash
npm test
```

### Component Tests (React Native Testing Library)

```typescript
// __tests__/AppIcon.test.tsx
import { render, screen } from '@testing-library/react-native';
import { AppIcon } from '@/src/components/AppIcon';

describe('AppIcon', () => {
  it('renders app label', () => {
    const app = { packageName: 'com.example', label: 'Example' };
    render(<AppIcon app={app} onPress={jest.fn()} />);
    expect(screen.getByText('Example')).toBeTruthy();
  });
});
```

### E2E Tests (Detox)

(Future: set up if needed)

## Release Process

1. **Bump version** in `app.json` and `package.json`
2. **Update CHANGELOG**
3. **Commit & tag**: `git tag v1.2.3`
4. **Push tags**: `git push origin v1.2.3`
5. **Run build pipeline**: GitHub Actions will auto-build
6. **Create GitHub Release** with artifacts

## Getting Help

- **Discord Server**: [link]
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For Q&A
- **Email**: devs@de-launcher.io

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native API](https://reactnative.dev/docs/getting-started)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Reanimated Docs](https://docs.swmansion.com/react-native-reanimated)
- [Android Developer Docs](https://developer.android.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

Happy coding! 🚀
