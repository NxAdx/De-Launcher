# De-Launcher — Design System v1.0

> **Focus. Simplified.**
> A calm, intentional visual system for a focus-first Android launcher.
> Neutral surfaces carry the interface; sage green signals attention, progress, and action.

---

## 01 · Brand Foundations

| Principle | Expression |
|---|---|
| **Focus** | Eye-like horizontal form represents attention and awareness |
| **De-clutter** | D structure and open negative space represent removing the unnecessary |
| **Forward** | Open right tip suggests direction without adding visual noise |

**Logo direction:** Abstract D + eye/leaf form, no internal "e".

---

## 02 · Color Tokens

### Dark Mode (Primary)

| Token | Value | Use |
|---|---|---|
| `bg` | `transparent` (wallpaper shows through) | Primary background |
| `surface` | `#121212` | Cards, grouped settings, elevated content |
| `surfaceElevated` | `#181818` | Higher-elevation overlays |
| `border` | `#242424` | Dividers, card borders |
| `borderFocused` | `#343434` | Focused input borders, interactive outlines |
| `textPrimary` | `#F2F2F2` | Primary text |
| `textSecondary` | `#9A9A9A` | Descriptions, secondary metadata |
| `textTertiary` | `#666666` | Hints, tertiary content |

### Light Mode

| Token | Value | Use |
|---|---|---|
| `bg` | `transparent` | Background |
| `surface` | `#FFFFFF` | Cards |
| `textPrimary` | `#171916` | Primary text |
| `textSecondary` | `#60675E` | Secondary text |
| `textTertiary` | `#747A72` | Tertiary text |

### Accent — Sage Green

| Token | Value | Use |
|---|---|---|
| `accent` (dark) | `#657D5C` | Selected states, focus indicators, switches |
| `accent` (light) | `#4F6548` | Same purpose, darker for light bg |
| `accentMuted` | `rgba(101, 125, 92, 0.15)` | Hover/pressed states |
| `accentTint` | `#9BAD93` | Greeting text, decorative elements |

### Semantic Colors

| Token | Value | Use |
|---|---|---|
| `error` | `#EF4444` | Blocked apps, destructive actions |
| `success` | `#22C55E` | Completions, streaks |
| `warning` | `#F59E0B` | Intent pause, caution states |

---

## 03 · Typography

**Recommended family:** Manrope or Inter.

| Element | Weight | Size | Notes |
|---|---|---|---|
| Clock display | Light/Thin | 56px | Large digital time, letter-spacing -3 |
| Date | Light | 16px | Below clock, letter-spacing 0.5 |
| Greeting | Medium | 13px | UPPERCASE, letter-spacing 1.5, sage tint color |
| Search placeholder | Regular | 14px | Inside pill/rounded search bar |
| Widget label | SemiBold | 12px | "DAILY FOCUS" — uppercase, letter-spacing 0.8 |
| Setting label | Medium | 14px | Setting row primary text |
| Setting description | Regular | 11px | Setting row secondary text |
| Section header | Bold | 12px | UPPERCASE, letter-spacing 0.6 |

---

## 04 · Spacing & Shape

### Spacing Scale (8dp grid)

| Token | Value | Use |
|---|---|---|
| `xxs` | 2px | Micro gaps |
| `xs` | 4px | Tight padding |
| `sm` | 8px | Component internal padding |
| `md` | 12px | Standard gap |
| `lg` | 16px | Content padding |
| `xl` | 24px | Screen horizontal inset |
| `2xl` | 32px | Large section gaps |
| `3xl` | 48px | Hero spacing |

### Border Radius

| Token | Value | Use |
|---|---|---|
| Card radius | 16dp | Settings groups, focus card |
| Control radius | 12dp | Buttons, segmented controls |
| Pill radius | 999dp | Search bar, compact actions |
| App icon radius | 18dp | Home grid app icons |
| Dock radius | 28dp | Bottom dock capsule |

---

## 05 · Components

### Settings Row
- Icon (20px) → Text group (label + description) → Right control
- Background: `rgba(255,255,255,0.03)` dark / `rgba(0,0,0,0.03)` light
- Grouped in `sectionGroup` with `borderRadius: 18`

### Segmented Control
- Container: `rgba(255,255,255,0.06)`, padding 3px, radius 10
- Active button: `accent` background, white `#FFFFFF` text
- Inactive: transparent, secondary text

### Daily Focus Widget (Collapsed)
- Single-row card with circle icon (accent border), "DAILY FOCUS" label, progress count, subtitle, ChevronRight

### All Apps Button
- Pill shape (border-radius: 999), outlined (1px border, `borderFocused`)
- Grid icon + "All Apps" text, centered below app grid

---

## 06 · UX Principles

### Do
- Keep 90% of the UI neutral; let green identify intentional actions
- Prefer fewer, larger decisions on the home screen over dense app grids
- Use motion sparingly: 180–250ms, ease-out, no decorative animation

### Avoid
- Bright wallpapers behind text and colorful icons competing for attention
- Using green on every control; it destroys its meaning as a focus signal

---

## 08 · Spring Animation Presets (120fps)

| Preset | Damping | Stiffness | Mass | Use |
|---|---|---|---|---|
| `snappy` | 20 | 400 | 0.4 | Buttons, toggles, dock icons |
| `gentle` | 22 | 260 | 0.5 | Page transitions, large moves |
| `bouncy` | 14 | 300 | 0.35 | Lift/drop, scale pops |
| `stiff` | 28 | 450 | 0.4 | Grid repositioning, zero overshoot |
| `drag` | 24 | 500 | 0.3 | Drag tracking, ultra-responsive |

---

*De-Launcher · Focus • Simplified · Design System v1.0*
