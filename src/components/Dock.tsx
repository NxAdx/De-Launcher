/**
 * Dock Component
 *
 * Fixed bottom bar for essential apps (supports up to 6 icons).
 * Features:
 * - Floating translucent glass capsule design
 * - Dynamic slot calculations for 1 to 6 apps
 * - Long-press and drag to reorder with snappy spring physics
 * - Haptic feedback integration
 */
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { LayoutChangeEvent, StyleSheet, View, Platform, useWindowDimensions } from "react-native";
import Animated, {
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { spacing, layout, springs } from "@/src/theme/tokens";
import { AppIcon } from "./AppIcon";
import { useAppStore } from "@/src/store/appStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { AppInfo } from "@/src/types/app";
import { launchApp } from "@/src/services/appManager";

interface DockProps {
  onLongPress: (app: AppInfo) => void;
}

interface DraggableDockIconProps {
  app: AppInfo;
  index: number;
  maxIndex: number;
  slotWidth: number;
  iconSize: number;
  onPress: (app: AppInfo) => void;
  onLongPress: (app: AppInfo) => void;
  onMove: (packageName: string, targetIndex: number) => void;
  onDrop: () => void;
}

function DraggableDockIcon({
  app,
  index,
  maxIndex,
  slotWidth,
  iconSize,
  onPress,
  onLongPress,
  onMove,
  onDrop,
}: DraggableDockIconProps) {
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);
  const targetX = index * slotWidth;
  const x = useSharedValue(targetX);
  const dragStartX = useSharedValue(targetX);
  const isDragging = useSharedValue(false);
  const didActivate = useSharedValue(false);
  const hasMoved = useSharedValue(false);
  const lastSwappedIndex = useSharedValue(-1);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);

  useEffect(() => {
    if (!isDragging.value) {
      x.value = withSpring(targetX, springs.snappy);
    }
  }, [isDragging, targetX, x]);

  const triggerLiftHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [hapticEnabled]);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activateAfterLongPress(layout.longPressDelay)
      .onStart(() => {
        didActivate.value = true;
        isDragging.value = true;
        hasMoved.value = false;
        dragStartX.value = x.value;
        scale.value = withSpring(1.15, springs.snappy);
        zIndex.value = 10;
        runOnJS(triggerLiftHaptic)();
      })
      .onUpdate((event) => {
        x.value = dragStartX.value + event.translationX;
        if (Math.abs(event.translationX) > 10) {
          hasMoved.value = true;
        }

        const targetIndex = Math.max(
          0,
          Math.min(maxIndex, Math.round(x.value / slotWidth))
        );
        if (targetIndex !== index && targetIndex !== lastSwappedIndex.value) {
          lastSwappedIndex.value = targetIndex;
          runOnJS(onMove)(app.packageName, targetIndex);
        }
      })
      .onFinalize(() => {
        lastSwappedIndex.value = -1;
        if (!didActivate.value) return;
        didActivate.value = false;
        isDragging.value = false;
        scale.value = withSpring(1, springs.snappy);
        zIndex.value = 1;
        x.value = withSpring(targetX, springs.snappy);

        if (hasMoved.value) {
          runOnJS(onDrop)();
        } else {
          runOnJS(onLongPress)(app);
        }
      });
  }, [
    app,
    index,
    maxIndex,
    slotWidth,
    onMove,
    onDrop,
    onLongPress,
    triggerLiftHaptic,
    x,
    dragStartX,
    isDragging,
    didActivate,
    hasMoved,
    scale,
    zIndex,
    lastSwappedIndex,
    targetX,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: slotWidth,
    transform: [{ translateX: x.value }, { scale: scale.value }],
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.dockItem, animatedStyle]}>
        <AppIcon
          app={app}
          onPress={onPress}
          size={iconSize}
          showLabel={false}
        />
      </Animated.View>
    </GestureDetector>
  );
}

export function Dock({ onLongPress }: DockProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);
  const dockBackground = useSettingsStore((s) => s.dockBackground);
  const maxDockIcons = useSettingsStore((s) => s.maxDockIcons);
  const iconSizeOption = useSettingsStore((s) => s.iconSize);

  const installedApps = useAppStore((s) => s.installedApps);
  const dockPackages = useAppStore((s) => s.dockPackages);
  const reorderDock = useAppStore((s) => s.reorderDock);
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [dockWidth, setDockWidth] = useState(() => Math.max(200, SCREEN_WIDTH - spacing.md * 2));

  const getBaseIconSize = () => {
    switch (iconSizeOption) {
      case "small":
        return 42;
      case "large":
        return 50;
      case "medium":
      default:
        return 46;
    }
  };

  const iconSize = getBaseIconSize();

  const dockApps = useMemo(() => {
    const installedByPackage = new Map(
      installedApps.map((app) => [app.packageName, app])
    );
    const seen = new Set<string>();
    const result: AppInfo[] = [];
    for (const pkg of dockPackages.slice(0, maxDockIcons)) {
      if (seen.has(pkg)) continue;
      const app = installedByPackage.get(pkg);
      if (app) {
        seen.add(pkg);
        result.push(app);
      }
    }
    return result;
  }, [installedApps, dockPackages, maxDockIcons]);

  const [orderedApps, setOrderedApps] = useState<AppInfo[]>(dockApps);
  const orderedAppsRef = useRef<AppInfo[]>(dockApps);

  useEffect(() => {
    orderedAppsRef.current = dockApps;
    setOrderedApps(dockApps);
  }, [dockApps]);

  const handlePress = useCallback((app: AppInfo) => {
    launchApp(app.packageName);
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setDockWidth(event.nativeEvent.layout.width);
  }, []);

  const handleMove = useCallback(
    (packageName: string, targetIndex: number) => {
      const current = orderedAppsRef.current;
      const sourceIndex = current.findIndex(
        (app) => app.packageName === packageName
      );
      const boundedIndex = Math.min(targetIndex, current.length - 1);
      if (sourceIndex === -1 || sourceIndex === boundedIndex) return;

      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(boundedIndex, 0, moved);
      orderedAppsRef.current = next;
      setOrderedApps(next);
      if (hapticEnabled) {
        Haptics.selectionAsync();
      }
    },
    [hapticEnabled]
  );

  const handleDrop = useCallback(() => {
    reorderDock(orderedAppsRef.current.map((app) => app.packageName));
  }, [reorderDock]);

  const slotWidth =
    dockWidth > 0 && orderedApps.length > 0
      ? dockWidth / orderedApps.length
      : 0;

  const maxIndex = Math.max(0, orderedApps.length - 1);

  const isFrosted = dockBackground === "frosted";

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      style={[
        styles.dockWrapper,
        {
          bottom: insets.bottom + spacing.xs,
        },
      ]}
    >
      <View
        style={[
          styles.dockCard,
          isFrosted && [
            styles.frostedCard,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(255, 255, 255, 0.75)",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.14)"
                : "rgba(0, 0, 0, 0.08)",
            },
          ],
        ]}
      >
        {isFrosted && Platform.OS === "ios" && (
          <BlurView
            intensity={40}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        )}

        <View style={styles.iconsContainer} onLayout={handleLayout}>
          {slotWidth > 0 &&
            orderedApps.map((app, index) => (
              <DraggableDockIcon
                key={app.packageName}
                app={app}
                index={index}
                maxIndex={maxIndex}
                slotWidth={slotWidth}
                iconSize={iconSize}
                onPress={handlePress}
                onLongPress={onLongPress}
                onMove={handleMove}
                onDrop={handleDrop}
              />
            ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dockWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  dockCard: {
    width: "100%",
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    overflow: "hidden",
  },
  frostedCard: {
    borderWidth: 1.2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  iconsContainer: {
    flex: 1,
    height: "100%",
    position: "relative",
  },
  dockItem: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
