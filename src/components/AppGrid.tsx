/**
 * AppGrid Component
 *
 * Renders a responsive horizontal paginated grid of app icons.
 * Supports interactive drag-to-reorder custom gestures with smooth spring tilt/scale animations.
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
import { useTheme } from "@/src/theme/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ROW_HEIGHT = 104;

interface DraggableItemProps {
  app: AppInfo;
  index: number; // global index in orderedApps
  apps: AppInfo[];
  itemWidth: number;
  gridColumns: number;
  pageIndex: number;
  pageSize: number;
  verticalOffset: number;
  onPress: (app: AppInfo) => void;
  onLongPress: (app: AppInfo) => void;
  isAnyDragging: SharedValue<boolean>;
  setScrollEnabled: (enabled: boolean) => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onDragEnd: (finalApps: AppInfo[]) => void;
}

function DraggableItem({
  app,
  index,
  apps,
  itemWidth,
  gridColumns,
  pageIndex,
  pageSize,
  verticalOffset,
  onPress,
  onLongPress,
  isAnyDragging,
  setScrollEnabled,
  onSwap,
  onDragEnd,
}: DraggableItemProps) {
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  const localIndex = index % pageSize;
  const col = localIndex % gridColumns;
  const row = Math.floor(localIndex / gridColumns);

  // Compute row offset for centering items that do not completely fill the gridColumns
  const pageStart = pageIndex * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, apps.length);
  const pageAppsCount = pageEnd - pageStart;
  const pageRows = Math.ceil(pageAppsCount / gridColumns);

  const itemsInRow = row === pageRows - 1 
    ? pageAppsCount - row * gridColumns 
    : gridColumns;
  const rowOffset = ((gridColumns - itemsInRow) * itemWidth) / 2;

  const targetX = col * itemWidth + rowOffset;
  const targetY = row * ROW_HEIGHT + verticalOffset;

  const x = useSharedValue(targetX);
  const y = useSharedValue(targetY);
  const isDragging = useSharedValue(false);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const zIndex = useSharedValue(1);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Synchronize target positions dynamically when indices/layouts update
  useEffect(() => {
    if (!isDragging.value) {
      x.value = withSpring(targetX, { damping: 18, stiffness: 240, mass: 0.9 });
      y.value = withSpring(targetY, { damping: 18, stiffness: 240, mass: 0.9 });
    }
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
      runOnJS(setScrollEnabled)(false);
      startX.value = x.value;
      startY.value = y.value;
      scale.value = withSpring(1.15, { damping: 15, stiffness: 200, mass: 0.8 });
      rotation.value = withSpring(4, { damping: 15, stiffness: 200, mass: 0.8 });
      zIndex.value = 999;
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      x.value = startX.value + event.translationX;
      y.value = startY.value + event.translationY;

      // Realtime grid swapping calculations based on Euclidean distance to visual cell centers
      const centerX = x.value + itemWidth / 2;
      const centerY = y.value + ROW_HEIGHT / 2;

      let closestIndex = -1;
      let minDistance = Infinity;

      for (let i = pageStart; i < pageEnd; i++) {
        if (i === index) continue; // skip self

        const localI = i % pageSize;
        const colI = localI % gridColumns;
        const rowI = Math.floor(localI / gridColumns);

        const itemsInRowI = rowI === pageRows - 1 
          ? pageAppsCount - rowI * gridColumns 
          : gridColumns;
        const rowOffsetI = ((gridColumns - itemsInRowI) * itemWidth) / 2;

        const centerCellX = colI * itemWidth + rowOffsetI + itemWidth / 2;
        const centerCellY = rowI * ROW_HEIGHT + verticalOffset + ROW_HEIGHT / 2;

        const dx = centerX - centerCellX;
        const dy = centerY - centerCellY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = i;
        }
      }

      // Swap threshold is 45% of item width to eliminate oscillation
      if (closestIndex !== -1 && minDistance < itemWidth * 0.45) {
        runOnJS(onSwap)(index, closestIndex);
        runOnJS(triggerLightHaptic)();
      }
    })
    .onEnd((event) => {
      isDragging.value = false;
      isAnyDragging.value = false;
      runOnJS(setScrollEnabled)(true);
      scale.value = withSpring(1, { damping: 20, stiffness: 180, mass: 0.9 });
      rotation.value = withSpring(0, { damping: 20, stiffness: 180, mass: 0.9 });
      zIndex.value = 1;

      // Snap home to new position
      x.value = withSpring(targetX, { damping: 18, stiffness: 240, mass: 0.9 });
      y.value = withSpring(targetY, { damping: 18, stiffness: 240, mass: 0.9 });

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
        { rotate: `${rotation.value}deg` },
      ],
      zIndex: zIndex.value,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <View style={styles.gridItem}>
          <AppIcon app={app} onPress={onPress} />
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
  const { colors } = useTheme();
  const gridColumns = useSettingsStore((s) => s.gridColumns);
  const setAllowedPackages = useAppStore((s) => s.setAllowedPackages);

  const [orderedApps, setOrderedApps] = useState<AppInfo[]>(apps);
  const isAnyDragging = useSharedValue(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [activePage, setActivePage] = useState(0);
  const [gridHeight, setGridHeight] = useState(416); // Standard 4 rows default

  // Synchronize dynamic updates from outer stores safely when drag gesture is inert
  useEffect(() => {
    if (!isAnyDragging.value) {
      setOrderedApps(apps);
    }
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

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setActivePage(page);
  };

  const handleLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > 0) {
      setGridHeight(height);
    }
  };

  const PAGE_SIZE = gridColumns * 4;
  const numPages = Math.ceil(orderedApps.length / PAGE_SIZE);

  // Group ordered apps into pages
  const pages = useMemo(() => {
    const grouped = [];
    for (let i = 0; i < numPages; i++) {
      grouped.push(orderedApps.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE));
    }
    return grouped;
  }, [orderedApps, numPages, PAGE_SIZE]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <ScrollView
        horizontal
        pagingEnabled
        scrollEnabled={scrollEnabled}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollStyle}
      >
        {pages.map((pageApps, pageIndex) => {
          // Centering offsets
          const pageRows = Math.ceil(pageApps.length / gridColumns);
          const activeRows = Math.min(4, Math.max(1, pageRows));
          const verticalOffset = Math.max(0, (gridHeight - activeRows * ROW_HEIGHT) / 2);

          return (
            <View
              key={pageIndex}
              style={[
                styles.pageContainer,
                { width: SCREEN_WIDTH, height: gridHeight },
              ]}
            >
              {pageApps.map((app, localIndex) => {
                const globalIndex = pageIndex * PAGE_SIZE + localIndex;
                return (
                  <DraggableItem
                    key={app.packageName}
                    app={app}
                    index={globalIndex}
                    apps={orderedApps}
                    itemWidth={itemWidth}
                    gridColumns={gridColumns}
                    pageIndex={pageIndex}
                    pageSize={PAGE_SIZE}
                    verticalOffset={verticalOffset}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    isAnyDragging={isAnyDragging}
                    setScrollEnabled={setScrollEnabled}
                    onSwap={handleSwap}
                    onDragEnd={handleDragEnd}
                  />
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {/* Dots page indicator */}
      {numPages > 1 && (
        <View style={styles.pageIndicator}>
          {Array.from({ length: numPages }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === activePage ? colors.accent : colors.textTertiary,
                  opacity: i === activePage ? 1 : 0.4,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  scrollStyle: {
    flex: 1,
  },
  pageContainer: {
    paddingHorizontal: spacing.xl,
    position: "relative",
  },
  gridItem: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    position: "absolute",
    bottom: spacing.xxs,
    left: 0,
    right: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
