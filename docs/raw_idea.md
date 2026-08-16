# De-Launcher: The Minimalist Productivity Launcher

## The Vision
De-Launcher is an Android home launcher designed to minimize phone usage and maximize productivity. It achieves this by providing a distraction-free environment that actively discourages the use of non-essential applications.

## Core Features
1. **Minimalist UI**: A clean, uncluttered interface that doesn't draw unnecessary attention.
2. **Whitelisted Apps Only**: The user can select which apps are essential (productive). Only these apps are readily available or visible on the homescreen/drawer.
3. **Distraction Blocking (Auto-Close)**: If the user attempts to launch an app that is marked as a distraction (or not whitelisted), the launcher will automatically close it or return to the home screen. This requires special permissions (like Accessibility Services, Device Admin, or Usage Access).
4. **Custom Widgets**: Users can add widgets, but **only** for apps that are on the allowed/productive list.
5. **Icon Customization**: Support for custom icon packs to maintain aesthetic consistency and personalization (like Nova Launcher).
6. **Dock**: A functional dock at the bottom of the screen for the most critical 4-5 apps.
7. **Screen Layout Customization**: Options to adjust grid size, padding, and layout (similar to Nova Launcher) while maintaining the minimal philosophy.

## Why?
Modern smartphones are designed to capture and hold attention. De-Launcher is a tool to take back control. By intentionally introducing friction to accessing distracting apps and streamlining access to productive tools, it helps users build better digital habits.

## What's Next?
- Determine the technical feasibility of the "auto-close" feature (Accessibility vs. Usage Stats vs. Device Admin) and how to expose it via an Expo Native Module.
- Design the UI/UX, prioritizing typography and whitespace.
- Set up the project using React Native and Expo.
