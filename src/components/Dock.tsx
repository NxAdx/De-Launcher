/**
 * Dock Component
 *
 * Fixed bottom bar for essential apps. Long-press and drag an icon to
 * reorder it; the final ordering is persisted when the drag settles.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
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
  slotWidth: number;
  onPress: (app: AppInfo) => void;
  onLongPress: (app: AppInfo) => void;
  onMove: (packageName: string, targetIndex: number) => void;
  onDrop: () => void;
}

function DraggableDockIcon({
  app,
  index,
  slotWidth,
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

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(layout.longPressDelay)
    .onStart(() => {
      didActivate.value = true;
      isDragging.value = true;
      hasMoved.value = false;
      dragStartX.value = x.value;
      scale.value = withSpring(1.12, springs.snappy);
      zIndex.value = 10;
      runOnJS(triggerLiftHaptic)();
    })
    .onUpdate((event) => {
      x.value = dragStartX.value + event.translationX;
      if (Math.abs(event.translationX) > 12) {
        hasMoved.value = true;
      }

      const targetIndex = Math.max(
        0,
        Math.min(4, Math.round(x.value / slotWidth))
      );
      if (targetIndex !== index) {
        runOnJS(onMove)(app.packageName, targetIndex);
      }
    })
    .onFinalize(() => {
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
          size={layout.appIconSize}
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
  const installedApps = useAppStore((s) => s.installedApps);
  const dockPackages = useAppStore((s) => s.dockPackages);
  const reorderDock = useAppStore((s) => s.reorderDock);
  const [dockWidth, setDockWidth] = useState(0);

  const dockApps = React.useMemo(() => {
    const installedByPackage = new Map(
      installedApps.map((app) => [app.packageName, app])
    );
    return dockPackages
      .map((pkg) => installedByPackage.get(pkg))
      .filter((app): app is AppInfo => !!app);
  }, [installedApps, dockPackages]);

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
    dockWidth > 0 && orderedApps.length > 0 ? dockWidth / orderedApps.length : 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(200)}
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.06)"
            : "rgba(0, 0, 0, 0.06)",
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.separator} />
      <View style={styles.icons} onLayout={handleLayout}>
        {slotWidth > 0 &&
          orderedApps.map((app, index) => (
            <DraggableDockIcon
              key={app.packageName}
              app={app}
              index={index}
              slotWidth={slotWidth}
              onPress={handlePress}
              onLongPress={onLongPress}
              onMove={handleMove}
              onDrop={handleDrop}
            />
          ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: layout.dockHeight,
    paddingHorizontal: spacing.xl,
  },
  separator: {
    width: 36,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignSelf: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  icons: {
    flex: 1,
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
