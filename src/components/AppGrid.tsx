/**
 * AppGrid Component
 *
 * Renders a responsive horizontal paginated grid of apps and folders.
 * Supports interactive drag-to-reorder custom gestures with smooth spring tilt/scale animations.
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
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
import { FolderIcon } from "./FolderIcon";
import { AppInfo, FolderInfo } from "@/src/types/app";
import { spacing } from "@/src/theme/tokens";
import { useSettingsStore } from "@/src/store/settingsStore";
import { useAppStore } from "@/src/store/appStore";

export type GridItemData =
  | { id: string; type: "app"; app: AppInfo }
  | { id: string; type: "folder"; folder: FolderInfo };

const ROW_HEIGHT = 92;

interface DraggableGridItemProps {
  item: GridItemData;
  index: number;
  items: GridItemData[];
  itemWidth: number;
  gridColumns: number;
  pageIndex: number;
  pageSize: number;
  verticalOffset: number;
  onPress: (app: AppInfo) => void;
  onLongPress: (app: AppInfo) => void;
  onFolderPress?: (folder: FolderInfo) => void;
  onFolderLongPress?: (folder: FolderInfo) => void;
  isAnyDragging: SharedValue<boolean>;
  setScrollEnabled: (enabled: boolean) => void;
  onSwap: (itemId: string, toIndex: number) => void;
  onDragEnd: () => void;
}

function DraggableGridItem({
  item,
  index,
  items,
  itemWidth,
  gridColumns,
  pageIndex,
  pageSize,
  verticalOffset,
  onPress,
  onLongPress,
  onFolderPress,
  onFolderLongPress,
  isAnyDragging,
  setScrollEnabled,
  onSwap,
  onDragEnd,
}: DraggableGridItemProps) {
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);

  const localIndex = index % pageSize;
  const col = localIndex % gridColumns;
  const row = Math.floor(localIndex / gridColumns);

  const pageStart = pageIndex * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, items.length);
  const pageItemsCount = pageEnd - pageStart;
  const pageRows = Math.ceil(pageItemsCount / gridColumns);

  const itemsInRow =
    row === pageRows - 1 ? pageItemsCount - row * gridColumns : gridColumns;
  const rowOffset = ((gridColumns - itemsInRow) * itemWidth) / 2;

  const targetX = spacing.xl + col * itemWidth + rowOffset;
  const targetY = row * ROW_HEIGHT + verticalOffset;

  const x = useSharedValue(targetX);
  const y = useSharedValue(targetY);
  const isDragging = useSharedValue(false);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const zIndex = useSharedValue(1);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const lastSwappedIndex = useSharedValue(-1);

  useEffect(() => {
    if (!isDragging.value) {
      x.value = withSpring(targetX, { damping: 18, stiffness: 240, mass: 0.9 });
      y.value = withSpring(targetY, { damping: 18, stiffness: 240, mass: 0.9 });
    }
  }, [isDragging, targetX, targetY, x, y]);

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [hapticEnabled]);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activateAfterLongPress(400)
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

        const currentLocalCol = Math.max(
          0,
          Math.min(gridColumns - 1, Math.round((x.value - spacing.xl - rowOffset) / itemWidth))
        );
        const currentLocalRow = Math.max(
          0,
          Math.min(3, Math.round((y.value - verticalOffset) / ROW_HEIGHT))
        );

        const newLocalIndex = currentLocalRow * gridColumns + currentLocalCol;
        const newGlobalIndex = pageIndex * pageSize + newLocalIndex;

        if (
          newGlobalIndex >= pageStart &&
          newGlobalIndex < pageEnd &&
          newGlobalIndex !== index &&
          newGlobalIndex !== lastSwappedIndex.value
        ) {
          lastSwappedIndex.value = newGlobalIndex;
          runOnJS(onSwap)(item.id, newGlobalIndex);
        }
      })
      .onFinalize(() => {
        isDragging.value = false;
        isAnyDragging.value = false;
        scale.value = withSpring(1, { damping: 18, stiffness: 240 });
        rotation.value = withSpring(0, { damping: 18, stiffness: 240 });
        zIndex.value = 1;
        lastSwappedIndex.value = -1;
        runOnJS(setScrollEnabled)(true);
        runOnJS(onDragEnd)();
      });
  }, [
    item.id,
    index,
    gridColumns,
    itemWidth,
    verticalOffset,
    rowOffset,
    pageIndex,
    pageSize,
    pageStart,
    pageEnd,
    isAnyDragging,
    setScrollEnabled,
    onSwap,
    onDragEnd,
    triggerHaptic,
    startX,
    startY,
    x,
    y,
    scale,
    rotation,
    zIndex,
    isDragging,
    lastSwappedIndex,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: 0,
    top: 0,
    width: itemWidth,
    height: ROW_HEIGHT,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <View style={styles.gridItem}>
          {item.type === "app" ? (
            <AppIcon
              app={item.app}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          ) : (
            <FolderIcon
              folder={item.folder}
              onPress={onFolderPress || (() => {})}
              onLongPress={onFolderLongPress}
            />
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

interface AppGridProps {
  apps: AppInfo[];
  folders?: FolderInfo[];
  onPress: (app: AppInfo) => void;
  onLongPress: (app: AppInfo) => void;
  onFolderPress?: (folder: FolderInfo) => void;
  onFolderLongPress?: (folder: FolderInfo) => void;
}

export function AppGrid({
  apps,
  folders = [],
  onPress,
  onLongPress,
  onFolderPress,
  onFolderLongPress,
}: AppGridProps) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const gridColumns = useSettingsStore((s) => s.gridColumns);
  const setAllowedPackages = useAppStore((s) => s.setAllowedPackages);

  const [gridHeight, setGridHeight] = useState(380);
  const [activePage, setActivePage] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const isAnyDragging = useSharedValue(false);

  // Combine folders and apps into unified grid items
  const combinedItems: GridItemData[] = useMemo(() => {
    const folderItems: GridItemData[] = folders.map((f) => ({
      id: f.id,
      type: "folder",
      folder: f,
    }));
    const appItems: GridItemData[] = apps.map((a) => ({
      id: a.packageName,
      type: "app",
      app: a,
    }));
    return [...folderItems, ...appItems];
  }, [folders, apps]);

  const [orderedItems, setOrderedItems] = useState<GridItemData[]>(combinedItems);
  const orderedItemsRef = useRef<GridItemData[]>(combinedItems);

  useEffect(() => {
    orderedItemsRef.current = combinedItems;
    setOrderedItems(combinedItems);
  }, [combinedItems]);

  const ROWS_PER_PAGE = 4;
  const PAGE_SIZE = gridColumns * ROWS_PER_PAGE;
  const numPages = Math.max(1, Math.ceil(orderedItems.length / PAGE_SIZE));

  const usableWidth = SCREEN_WIDTH - spacing.xl * 2;
  const itemWidth = usableWidth / gridColumns;

  const handleLayout = (e: any) => {
    const height = e.nativeEvent.layout.height;
    if (height > 0) {
      setGridHeight(height);
    }
  };

  const handleScroll = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setActivePage(page);
  };

  const handleSwap = useCallback((itemId: string, toIndex: number) => {
    const current = orderedItemsRef.current;
    const fromIndex = current.findIndex((item) => item.id === itemId);
    if (fromIndex === -1 || fromIndex === toIndex) return;

    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    orderedItemsRef.current = next;
    setOrderedItems(next);
  }, []);

  const handleDragEnd = useCallback(() => {
    const nextApps = orderedItemsRef.current
      .filter((item): item is { id: string; type: "app"; app: AppInfo } => item.type === "app")
      .map((item) => item.app.packageName);
    setAllowedPackages(nextApps);
  }, [setAllowedPackages]);

  const pages = useMemo(() => {
    const grouped = [];
    for (let i = 0; i < numPages; i++) {
      grouped.push(orderedItems.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE));
    }
    return grouped;
  }, [orderedItems, numPages, PAGE_SIZE]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <ScrollView
        horizontal
        pagingEnabled
        scrollEnabled={scrollEnabled}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={styles.scrollStyle}
      >
        {pages.map((pageItems, pageIndex) => {
          const verticalOffset = Math.max(0, (gridHeight - 4 * ROW_HEIGHT) / 2);

          return (
            <View
              key={pageIndex}
              style={[
                styles.pageContainer,
                { width: SCREEN_WIDTH, height: gridHeight },
              ]}
            >
              {pageItems.map((item, localIndex) => {
                const globalIndex = pageIndex * PAGE_SIZE + localIndex;
                return (
                  <DraggableGridItem
                    key={item.id}
                    item={item}
                    index={globalIndex}
                    items={orderedItems}
                    itemWidth={itemWidth}
                    gridColumns={gridColumns}
                    pageIndex={pageIndex}
                    pageSize={PAGE_SIZE}
                    verticalOffset={verticalOffset}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    onFolderPress={onFolderPress}
                    onFolderLongPress={onFolderLongPress}
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

      {numPages > 1 && (
        <View style={styles.pageIndicator}>
          {Array.from({ length: numPages }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activePage ? "#FFFFFF" : "rgba(255, 255, 255, 0.2)",
                  transform: [{ scale: i === activePage ? 1.2 : 1 }],
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
