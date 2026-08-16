# De-Launcher UX/UI Improvement Plan

Last reviewed: 2026-05-28

## Product Direction

De-Launcher should feel faster and calmer than the stock launcher while never
making the device harder to control. The product promise is selective friction:
chosen apps are immediate; distractions require intention; Settings, emergency
configuration, and permission controls remain reachable at all times.

The strategic position is: a calm Android launcher with a Flow-like command
layer. The home screen stays minimal, but power is one gesture or search away.

Design principles:

1. Fast first action: dock and allowed apps should be visible with stable icons
   as soon as the home surface appears.
2. Clear control: users must always understand how to add, remove, reorder, or
   restore access to an app.
3. Safe restriction: focus enforcement must never block system recovery routes.
4. Quiet hierarchy: typography, spacing, and one restrained accent should do
   more work than decoration.
5. Accessible interaction: all actions need labels, 48dp targets, predictable
   back behavior, and non-gesture alternatives.

## Competitive Research Inputs

The plan now includes patterns from these launchers and launcher-adjacent tools:

| Product | Relevant Ideas | De-Launcher Direction |
| --- | --- | --- |
| [minimalist phone](https://faq.minimalistphone.com/en/article/how-does-minimalist-phone-work-10lkqlz/) | Text-first home, in-app timers, app blocking, schedules, notification filter, hidden apps, monochrome mode, mindful launch delay, folders, favorites, rename actions | Use selective friction for blocked apps, not blanket punishment. Add time reminders, delayed launch, schedules, hidden apps, and notification digest as focus tools. |
| [Flow Launcher](https://www.flowlauncher.com/) | Hotkey command bar, app/file search, web searches, system commands, calculator, Settings search, plugin store | Adapt the concept into an Android universal command bar: apps, Settings actions, focus toggles, shortcuts, and later local plugins. This is inspiration, not a direct platform copy. |
| [Olauncher](https://f-droid.org/en/packages/app.olauncher/) / [Launch0](https://launch0.app/) | Text-based home, quick search, swipe gestures, daily wallpaper, no ads, no tracking, hidden apps, rename apps, screen-time awareness | Offer a text-only mode, gesture shortcuts, app aliases, hidden apps, and local-only usage awareness. Keep privacy explicit. |
| [Niagara Launcher](https://play.google.com/store/apps/details?id=bitpit.launcher) | One-handed app access, adaptive list, alphabet navigation, embedded notifications, notification summaries, usage reminders | Add a one-hand list layout, optional alphabet rail, notification digest, and gentle usage reminders that do not trap users. |
| [Zelyft](https://zelyft.nuclosoft.com/), [Oasis](https://www.oasislauncher.com/), [Evolve](https://www.evolvelauncher.com/) | Conscious delay, app interrupts, focus mode, productivity widgets, local analytics, privacy-first positioning | Build intent prompts, breathing/reflection delays, focus profiles, simple widgets, and on-device insights as optional layers over the core launcher. |
| [Before Launcher](https://beforelabs.com/faqs) | Notification filtering, text display, recovery guidance for default launcher and notification access issues, paid Pro precedent | Learn from the support burden: recovery paths, default-home access, and notification permission education must be first-class before monetization. |

## Competitor-Inspired Feature Backlog

### P0: Free Core Differentiators

1. Universal command bar, inspired by Flow Launcher.
   Open from swipe down, dock action, or search button. It should find apps,
   open De-Launcher settings sections, open Android recovery settings, toggle
   focus modes, launch app shortcuts, and eventually run simple local actions
   such as calculations. This remains free because it becomes the launcher's
   primary navigation layer.

2. Focus rules and intent pause.
   Per-app rules should support allow, delay, ask-for-intent, usage reminder,
   scheduled block, and strict block. The first version can reuse the existing
   accessibility enforcement path and add a pre-launch interstitial for allowed
   but distracting apps. Safety rule: Phone, Settings, permission screens,
   default-home screens, emergency paths, and recovery routes are never blocked.

3. Notification digest.
   Add a notification listener based digest for selected apps. Important
   notifications can remain immediate; low-urgency apps are batched into a
   deliberate review surface. The UX should explain what is filtered, when the
   digest appears, and how to restore normal notifications.

4. Text-only and one-hand home mode.
   Add a layout choice alongside the current grid: `Icon Grid`, `Text List`,
   and `One-Hand List`. The one-hand mode should support left/right alignment,
   large tap rows, alphabet jump, search-first fallback, and visible edit
   controls.

5. First-run onboarding.
   The setup flow should combine the reliability work with the product idea:
   choose essentials, choose distractions, pick home layout, learn recovery,
   optionally set as default launcher, optionally enable focus enforcement.

### P1: Free Usability Depth

1. App aliases and renaming, so search matches the user's mental model.
2. Hidden apps and archive, with a visible recovery/search route.
3. Gesture shortcuts, with non-gesture equivalents in Settings.
4. Favorites, folders, or collections that stay calm and do not recreate a
   cluttered stock launcher.
5. Local usage summaries for top apps, focus saves, and most-opened distractions.
6. Built-in minimal widgets for date, battery, calendar preview, notes, tasks,
   screen-time awareness, and focus status.
7. Daily wallpaper or monochrome appearance presets for users who want visual
   freshness without icon noise.

### P2: Future Power Layer

1. Local plugin/action architecture for command-bar actions.
2. Advanced icon/theme marketplace support.
3. Optional AI-assisted focus suggestions that run with strong privacy controls.
4. Cross-device backup and restore.
5. Family, student, or team focus profiles only after the personal launcher is
   reliable and trusted.

## Monetization Direction (Future Only)

Current rule: every feature we implement during this phase is free. Do not add
trial limits, locked counts, paywalled focus rules, ads, tracking, or purchase
screens while the core product is still earning trust.

When monetization begins, use feature flags but default them to free until the
business decision is explicit. The future paid surface can include advanced
personalization packs, premium themes, curated icon collections, cloud backup,
cross-device sync, advanced automation recipes, family/team profiles, and a
plugin marketplace.

The free baseline must continue to include default launcher safety, Settings
recovery, app launching, dock/grid/list layout basics, custom icon selection,
basic command bar, basic focus rules, basic notification digest, app hiding,
renaming, accessibility support, and privacy controls. The launcher should never
make a user pay to regain control of their device or reduce distractions.

Monetization principle: no ads, no behavioral tracking, no dark patterns. Paid
features should feel like support and advanced personalization, not a toll on
wellbeing.

## Current Experience Audit

| Area | Current Strength | Main UX Risk |
| --- | --- | --- |
| Home | Minimal clock, focused app surface, persistent allowed list | Editing behavior is partly hidden behind long press; icons have been visibly late during launch |
| Dock | Five-app limit matches focus goal | Until this work it could only be reordered through indirect actions |
| Drawer | Search and allowed/blocked filters with virtualized list | Allow toggle and app launching are close together and need clearer focus feedback |
| Settings | Covers grid, labels, clock, dock, icon packs, system actions | Dense single scroll page; icon packs previously blocked rendering; theme state is inconsistent with forced dark UI |
| Restriction service | Implements immediate return-to-home enforcement | Previously able to block Android Settings and trap a default-launcher user |
| Widgets | Native host scaffolding exists | No completed selection/binding flow, so it is not yet a user feature |

## Repairs Implemented Now

1. Dock apps can be reordered by long-press dragging, and order is persisted at
   drop. Home-grid drag persistence was also corrected to commit the final order.
2. Startup icon work now prioritizes visible home and dock apps rather than
   rendering first and converting every installed app icon in parallel.
3. Repeated icon bridge calls are deduplicated; system icons remain visible as
   immediate fallbacks while a custom icon pack icon resolves.
4. Icon-pack Settings discovery is now lightweight. It discovers standard
   declared icon packs without parsing every mapping up front; mappings parse
   once on demand after selection.
5. Android Settings, default-home configuration, accessibility configuration,
   permission controllers, and system chooser surfaces are exempt from focus
   blocking so the default launcher cannot lock users out of device controls.

## Priority Findings

### P0: Release Safety And Trust

1. There is no guided first-run flow for selecting De-Launcher as Home,
   enabling focus enforcement, or explaining recovery paths.
   Build a three-step onboarding flow with skip and undo paths:
   choose allowed apps, optionally enable focus mode, optionally set as Home.
   Always show an explicit "Open Android Settings" recovery action.

2. Restriction behavior needs visible feedback.
   When an app is blocked, return home with a brief non-judgmental message such
   as "Not in Focus apps" plus actions to dismiss or review allowed apps.
   Do not silently bounce the user with no explanation.

3. Native launcher behavior lacks an automated device test gate.
   Validate default-home selection, HOME presses, focus blocking exemptions,
   process restarts, and OS Settings access on at least API 29, 33, and 36.

### P1: Core Usability

1. Establish one edit model for Home.
   Add an explicit edit mode entered by long press on empty space or a visible
   edit action. In edit mode, show drag affordances, dock capacity, remove
   targets, and a Done action. Keep the context-menu movement commands as an
   accessible non-drag alternative.

2. Reorganize Settings around user goals.
   Use sections or subpages for `Home Layout`, `Focus Mode`, `Appearance`, and
   `System & Recovery`. Keep the recovery section near the top once the app is
   default Home. Move About below functional controls.

3. Replace the dock configuration modal's all-app `ScrollView` with a
   searchable `FlashList`.
   Show selected dock apps first, preserve the five-slot capacity indicator,
   and provide drag reordering inside the configuration surface.

4. Resolve the theme contract.
   The store declares light/dark settings while the theme provider forces OLED
   dark mode. Either implement both themes with contrast testing or remove the
   inactive choice and communicate "OLED dark only" clearly.

5. Make icon pack choice progressive and reversible.
   Show `Default icons` immediately, a loading state for discovery, a compact
   preview row after a pack is selected, and a restore-default action. Add an
   optional deeper compatibility scan rather than making normal Settings pay
   for scanning every installed application.

### P2: Quality And Differentiation

1. Complete widget binding only after the core launcher is reliable; constrain
   widgets to allowed apps and supply remove/resize affordances.
2. Add optional text-only home and drawer presentation for maximum calm.
3. Respect reduced motion and font scaling, particularly for large clock text,
   grid pagination, drag lift animations, and modal sheets.
4. Support package install/uninstall changes without relaunching the launcher.
5. Add local-only focus summaries only if they reinforce intent rather than
   increasing engagement.

## Interaction And Visual Standards

| Topic | Standard |
| --- | --- |
| Touch targets | Minimum 48dp for settings, drawer controls, dock, and context actions |
| Typography | Keep Inter; use at least 14sp functional labels and avoid 10sp essential descriptions |
| Contrast | Meet 4.5:1 for normal text and ensure tertiary text is not used for required actions |
| Motion | 150-300ms purposeful transitions; reduce or remove animation when reduced motion is enabled |
| Loading | Keep tile dimensions stable; show skeleton or status text for operations over 300ms |
| Navigation | Home key returns to home; back exits subpages predictably; Settings recovery is always accessible |
| Feedback | Press, reorder, save, block, error, and capacity-limit actions have visible and accessible feedback |

## Performance Targets

| Journey | Target | Validation |
| --- | --- | --- |
| Cached cold launch to populated home icons | Under 500ms after React surface is ready | Macrobenchmark or timestamp logging on a mid-range device |
| Returning Home from another app | No icon flash; interactive within one frame after resume | Screen recording and trace |
| Opening Settings | Content visible immediately; icon-pack section never blocks scrolling | Device journey with 0, 1, and 5 icon packs |
| Selecting an icon pack | System icons remain visible until replacements arrive; no blank tiles | Screen recording on large allowed-app set |
| Drawer search | Keystroke-to-filter under 100ms with 200 apps | Profile JS/render thread |

## Validation Checklist

1. Set De-Launcher as default Home and verify its in-app Settings opens.
2. Enable the accessibility focus service, remove Android Settings from allowed
   apps, and verify Android Settings still opens and remains usable.
3. Press Home from Settings and from another app; verify routing returns to the
   launcher home once and does not disrupt in-app navigation.
4. Drag each dock icon across multiple slots, restart the app, and verify order
   persists. Repeat with TalkBack using the non-drag movement actions.
5. Cold-launch with a large installed-app list and compare icon appearance time
   before and after cached launch.
6. Open Settings with no icon packs and with standard icon packs installed;
   verify immediate scrolling, clear loading/empty states, and pack selection.
7. Test largest system font size, TalkBack labels, reduced motion, portrait
   small phone, and landscape/tablet behavior before a public release.

## Delivery Sequence

1. Ship and device-verify the reliability fixes in this change set.
2. Build onboarding, focus-block feedback, and recovery entry points.
3. Add the universal command bar MVP: app search, settings commands, Android
   recovery actions, and focus toggles.
4. Refactor Settings information architecture and dock configuration list.
5. Add focus rules: intent pause, launch delay, usage reminder, schedules, and
   strict block.
6. Add text-only and one-hand list layouts, with app aliases and hidden apps.
7. Add notification digest and local usage summaries after permission education
   and recovery paths are stable.
8. Complete accessibility and performance instrumentation.
9. Expand customization with widgets, compatibility scanning, themes, daily
   wallpaper, and plugin-ready command actions.
10. Introduce monetization only after the free core is trusted; keep safety,
   basic focus, command search, and recovery features permanently free.
