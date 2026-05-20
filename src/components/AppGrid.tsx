/**
 * AppGrid Component
 *
 * Renders a responsive grid of app icons.
 * Supports interactive drag-to-reorder custom gestures with spring animations.
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { AppIcon } from "./AppIcon";
import { AppInfo } from "@/src/types/app";
import { spacing, layout } from "@/src/theme/tokens";
import { useSettingsStore } from "@/src/store/settingsStore";
import { useAppStore } from "@/src/store/appStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ROW_HEIGHT = 104;

interface DraggableItemProps {
  app: AppInfo;
  index: number;
  apps: AppInfo[];
  itemWidth: number;
  gridColumns: number;
  onPress: (app: AppInfo) => void;
  onLongPress: (app: AppInfo) => void;
  isAnyDragging: SharedValue<boolean>;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onDragEnd: (finalApps: AppInfo[]) => void;
}

function DraggableItem({
  app,
  index,
  apps,
  itemWidth,
  gridColumns,
  onPress,
  onLongPress,
  isAnyDragging,
  onSwap,
  onDragEnd,
}: DraggableItemProps) {
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  // Position calculations based on dynamic grid layout
  const col = index % gridColumns;
  const row = Math.floor(index / gridColumns);
  const targetX = col * itemWidth;
  const targetY = row * ROW_HEIGHT;

  const x = useSharedValue(targetX);
  const y = useSharedValue(targetY);
  const isDragging = useSharedValue(false);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Synchronize target positions dynamically when indices/layouts update
  useEffect(() => {
    if (!isDragging.value) {
      x.value = withSpring(targetX, { damping: 18, stiffness: 180 });
      y.value = withSpring(targetY, { damping: 18, stiffness: 180 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetX, targetY]);

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const triggerLightHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(400) // 400ms long press lifts the item
    .onStart(() => {
      isDragging.value = true;
      isAnyDragging.value = true;
      startX.value = x.value;
      startY.value = y.value;
      scale.value = withSpring(1.18, { damping: 15, stiffness: 200 });
      zIndex.value = 999;
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      x.value = startX.value + event.translationX;
      y.value = startY.value + event.translationY;

      // Realtime grid swapping calculations based on current dragging center point
      const centerX = x.value + itemWidth / 2;
      const centerY = y.value + ROW_HEIGHT / 2;
      
      const hoverCol = Math.min(Math.max(Math.floor(centerX / itemWidth), 0), gridColumns - 1);
      const hoverRow = Math.max(Math.floor(centerY / ROW_HEIGHT), 0);
      const hoverIndex = Math.min(hoverRow * gridColumns + hoverCol, apps.length - 1);

      if (hoverIndex >= 0 && hoverIndex < apps.length && hoverIndex !== index) {
        runOnJS(onSwap)(index, hoverIndex);
        runOnJS(triggerLightHaptic)();
      }
    })
    .onEnd((event) => {
      isDragging.value = false;
      isAnyDragging.value = false;
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      zIndex.value = 1;
      
      // Snap home to new position
      x.value = withSpring(targetX, { damping: 18, stiffness: 180 });
      y.value = withSpring(targetY, { damping: 18, stiffness: 180 });

      // Identify if the gesture was just a long-press click or a true swap action
      const distance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
      if (distance < 15) {
        runOnJS(onLongPress)(app);
      } else {
        runOnJS(onDragEnd)(apps);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      width: itemWidth,
      height: ROW_HEIGHT,
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        { scale: scale.value },
      ],
      zIndex: zIndex.value,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <View style={styles.gridItem}>
          <AppIcon
            app={app}
            onPress={onPress}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

interface AppGridProps {
  apps: AppInfo[];
  onPress: (app: AppInfo) => void;
  onLongPress: (app: AppInfo) => void;
}

export function AppGrid({ apps, onPress, onLongPress }: AppGridProps) {
  const gridColumns = useSettingsStore((s) => s.gridColumns);
  const setAllowedPackages = useAppStore((s) => s.setAllowedPackages);

  const [orderedApps, setOrderedApps] = useState<AppInfo[]>(apps);
  const isAnyDragging = useSharedValue(false);

  // Synchronize dynamic updates from outer stores safely when drag gesture is inert
  useEffect(() => {
    if (!isAnyDragging.value) {
      setOrderedApps(apps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps]);

  const itemWidth = useMemo(() => {
    const totalPadding = spacing.xl * 2;
    return (SCREEN_WIDTH - totalPadding) / gridColumns;
  }, [gridColumns]);

  const handleSwap = useCallback((fromIndex: number, toIndex: number) => {
    setOrderedApps((prev) => {
      const next = [...prev];
      const temp = next[fromIndex];
      next[fromIndex] = next[toIndex];
      next[toIndex] = temp;
      return next;
    });
  }, []);

  const handleDragEnd = useCallback((finalApps: AppInfo[]) => {
    const packages = finalApps.map((a) => a.packageName);
    setAllowedPackages(packages);
  }, [setAllowedPackages]);

  const numRows = Math.ceil(orderedApps.length / gridColumns);
  const containerHeight = numRows * ROW_HEIGHT + spacing.xl + layout.dockHeight;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        { height: containerHeight }
      ]}
      showsVerticalScrollIndicator={false}
    >
      {orderedApps.map((app, index) => (
        <DraggableItem
          key={app.packageName}
          app={app}
          index={index}
          apps={orderedApps}
          itemWidth={itemWidth}
          gridColumns={gridColumns}
          onPress={onPress}
          onLongPress={onLongPress}
          isAnyDragging={isAnyDragging}
          onSwap={handleSwap}
          onDragEnd={handleDragEnd}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: spacing.xl,
    position: "relative",
  },
  gridItem: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
});
