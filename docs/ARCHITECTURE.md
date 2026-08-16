# De-Launcher: Architecture Document

## Overview
De-Launcher is a custom Android home replacement app (launcher) built to prioritize productivity and minimize distractions. It replaces the default Android home screen and provides a custom interface, app drawer, and application management system.

## Tech Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Zustand / Context API
- **Local Storage**: MMKV for fast key-value storage of allowed apps, dock state, and settings
- **Native Integrations**: Expo Modules (to handle specific Android Launcher Intents, AppWidgetHost, and Accessibility Services which are not available in standard Expo).

## Core Components

### 1. Launcher Entry (`app/_layout.tsx`, `app/index.tsx` & Native Module)
- Expo Router owns the app entry and route layout.
- Must have the `<category android:name="android.intent.category.HOME" />` and `<category android:name="android.intent.category.DEFAULT" />` in its Android manifest. (Configured via Expo Config Plugin).
- Hosts the React Native UI (Homescreen, Dock, App Drawer).

### 2. App Data Manager (Expo Module Wrapper)
- A custom Expo Native Module responsible for querying the system's `PackageManager` to retrieve the list of installed applications.
- The current module returns installed launchable apps and icons. Package add/remove/change events are a future enhancement.
- Expo Go uses a JavaScript fallback dataset because local native modules are not available there.

### 3. Productivity & Distraction Engine
- **Allowed Apps Repository**: MMKV stores the package names of apps explicitly whitelisted.
- **Distraction Blocking Mechanism**:
    - *Approach A (Accessibility Service)*: The most robust way to detect when a non-whitelisted app is brought to the foreground. The service monitors `AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED`. If a distracting app opens, the service can execute a `GLOBAL_ACTION_HOME` to force the user back to the launcher, effectively "closing" or minimizing the distraction.
    - *Approach B (UsageStatsManager)*: Polling the current foreground app using `UsageStatsManager`. Less battery efficient and can have a slight delay compared to Accessibility Services.
    - *Approach C (Device Admin/Profile Owner)*: Highly restrictive, typically used for enterprise. Can completely hide/suspend apps (`setPackagesSuspended`). Might be too complex for a standard consumer app, but very effective.
    - *Recommendation*: Start with **Accessibility Service** as it provides immediate feedback without needing full MDM (Mobile Device Management) provisioning.

### 4. Customization Engine
- **Icon Pack Support**:
    - Custom Native Module parses standard Android icon pack APKs.
    - Extracts `appfilter.xml` to map package/activity names to custom drawable resources and passes URIs to React Native.
    - Applies these custom icons in the React Native UI using `Image` components.
- **Layout Manager**:
    - Manages grid size (rows, columns) and padding settings.
    - Stores configurations in `DataStore` (Preferences).

### 5. Widget Host (`AppWidgetHost` Native Module)
- Android allows third-party launchers to host widgets.
- We need to implement a complex custom Expo Native View that wraps `AppWidgetHost` and `AppWidgetHostView` to render Android widgets inside React Native.
- **Constraint**: The UI must enforce a rule where the user can only select widgets belonging to the packages present in the "Allowed Apps Repository".

## Data Flow
1. **User Intent**: User scrolls the app drawer or clicks an app.
2. **State/Logic**: Processes the intent. If it's a launch intent, it checks the `Productivity Engine`.
3. **Productivity Engine**: Validates if the app is allowed.
    - If YES: Calls Native Module to fire the `Intent` to launch the app.
    - If NO: The React Native UI keeps it out of the allowed home grid. If launched externally, the Accessibility Service handles the fallback.
4. **State Flow**: The state manager updates the UI state (e.g., list of allowed apps), and React Native re-renders the view.

## Security and Permissions
- `QUERY_ALL_PACKAGES` (Required for Android 11+ to list all apps).
- `BIND_ACCESSIBILITY_SERVICE` (For the auto-close functionality).
- `BIND_APPWIDGET` (For hosting widgets).
- `REQUEST_DELETE_PACKAGES` (Optional, if allowing uninstallation from the launcher).
