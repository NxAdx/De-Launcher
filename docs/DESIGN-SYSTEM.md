# De-Launcher: Design System & UI/UX Guidelines

## Design Philosophy: "Intentional Minimalism"
De-Launcher aims to reduce cognitive load and prevent endless scrolling. The design should be stark, clean, and highly intentional. Every pixel must serve a purpose. If it doesn't help the user achieve a productive task, it shouldn't be on the screen.

## 1. Typography (The Primary UI Element)
Since icons can be distracting, typography plays a massive role in a minimal launcher.
- **Primary Font**: A clean, modern sans-serif (e.g., *Inter*, *Roboto*, or *SF Pro* equivalent). It should be highly legible even at smaller sizes.
- **Scale**:
    - App Labels (Homescreen): 12sp - 14sp, Regular/Medium.
    - App Labels (Drawer): 16sp, Medium.
    - Headers/Time (Widget): 32sp - 48sp, Light/Thin.
- **Hierarchy**: Use weight and opacity to establish hierarchy rather than just size.

## 2. Color Palette
The color palette should be inherently dark or muted to reduce screen glare and visual fatigue.

### Dark Mode (Default & Recommended)
- **Background**: `#000000` (Pure Black - great for OLED) or `#121212` (Material Dark).
- **Primary Text**: `#FFFFFF` (87% opacity for standard text).
- **Secondary Text**: `#FFFFFF` (60% opacity for less important info).
- **Accent/Highlight**: A single, muted accent color (e.g., `#BB86FC` or a soft monochrome like `#E0E0E0`). Avoid bright reds/greens unless indicating an explicit error/success state.

### Light Mode (Optional)
- **Background**: `#FFFFFF` or `#F5F5F5`.
- **Primary Text**: `#000000` (87% opacity).
- **Secondary Text**: `#000000` (60% opacity).

## 3. Spacing & Layout
- **Grid System**: Based on a standard 8dp grid.
- **Homescreen**:
    - High padding around the edges.
    - Apps should feel spaced out, not cramped.
    - The dock should have a clear, but subtle, visual separation (perhaps just increased padding above it, rather than a physical line).
- **App Drawer**:
    - Can be a standard grid or a minimalist **Text-Only List** (an option many minimal launchers use to further reduce visual stimulation).

## 4. Components

### Icons
- Default to monochrome or wireframe icons if the user doesn't apply a custom pack.
- **Icon Packs**: Native discovery and parser scaffolding exists. Full activity-to-drawable mapping still needs real-device validation across common packs.

### Widgets
- Widgets are supported but restricted to "Allowed Apps".
- Current implementation has a native host view and allocation hook. The Android widget binding flow still needs completion before this is considered user-ready.
- The launcher should attempt to apply a dark/monochrome filter to widgets if the OS allows it (Android 12+ dynamic coloring can help here).

### The Dock
- Holds 1 to 5 maximum essential apps (e.g., Phone, Messages, Camera, Notes).
- Fixed at the bottom.

## 5. Animations & Transitions
- **Speed**: Snappy and immediate. No slow, lingering animations that waste time.
- **Style**: Simple fades and slight scales. Avoid complex physics-based bounce or heavy parallax effects.
- **Opening an App**: A quick scale-up/fade.
- **Auto-Close (Distraction Prevention)**: If a user hits a blocked app, the screen should immediately snap back to home, perhaps with a subtle, non-aggressive toast message like "Focus." or simply a brief vibration (haptic feedback).

## 6. Accessibility
- Ensure high contrast ratios (minimum 4.5:1 for normal text).
- Support dynamic text sizing based on OS settings.
- Ensure all touch targets are at least 48x48dp, even if the visual icon/text is smaller.
