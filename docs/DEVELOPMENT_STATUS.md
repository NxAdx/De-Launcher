# Development Status

Last updated: 2026-05-19

## Summary

De-Launcher is a functional prototype on Expo SDK 55. The React Native interface is usable, persistent settings are wired, and Android native module code exists for launcher-specific behavior. Expo Go is supported as a UI preview path with demo app data, while real launcher behavior requires an Android development or production build.

## Completed

- Expo Router screens: home, app drawer, settings, dock settings, onboarding.
- Dynamic responsive App Grid with auto row-height calculation & dedicated non-overlapping pagination.
- Intentional Daily Focus & GitHub-style activity streak heatmap widget with instant reactive updates.
- Floating Frosted & Transparent Capsule Dock with snappy reordering physics.
- Multi-theme engine (Dark Mode / Light Mode) with high-contrast token palettes.
- Custom Icon Pack discovery with interactive dropdown selector and System Default fallback.
- Zustand stores for apps, whitelist, dock, intentional tasks, and customizable settings.
- MMKV persistence in native builds with an Expo Go-safe fallback.
- Android Expo module for installed apps, launching, whitelist sync, icon packs, and widget support.
- Accessibility service declaration and service implementation.
- Config plugin for Android launcher intent and service registration.
- Complete issue resolution and state tracking documented in `docs/ISSUES_TRACKER.md`.
- `npm test` validation script covering TypeScript and lint.

## Needs More Development

- Android device validation for launcher selection and home intent behavior.
- Accessibility permission onboarding and user-facing blocked-app feedback.
- Full icon-pack mapping based on parsed component/activity names.
- Widget picker and bind result flow.
- Unit/component tests beyond static checks.
- EAS project id and release signing configuration.

## Validation Commands

```bash
npm test
npm start
npm run android
```

Use `npm start` with Expo Go for interface preview. Use `npm run android` for native launcher features.
