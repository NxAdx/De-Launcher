/**
 * AppGrid Component
 *
 * Renders a responsive horizontal paginated grid of apps and folders.
 * Supports interactive drag-to-reorder custom gestures with smooth spring tilt/scale animations.
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, StyleSheet, ScrollView, useWindowDimensions, Pressable, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LayoutGrid } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { AppIcon } from "./AppIcon";
import { FolderIcon } from "./FolderIcon";
import { AppInfo, FolderInfo } from "@/src/types/app";
import { spacing, springs, typography } from "@/src/theme/tokens";
import { useSettingsStore } from "@/src/store/settingsStore";
import { useAppStore } from "@/src/store/appStore";

export type GridItemData =
  | { id: string; type: "app"; app: AppInfo }
  | { id: string; type: "folder"; folder: FolderInfo };

const BASE_ROW_HEIGHT = 88;

interface DraggableGridItemProps {
  item: GridItemData;
  index: number;
  items: GridItemData[];
  itemWidth: number;
  rowHeight: number;
  gridColumns: number;
  maxRows: number;
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
  rowHeight,
  gridColumns,
  maxRows,
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
  const targetY = row * rowHeight + verticalOffset;

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
      x.value = withSpring(targetX, springs.stiff);
      y.value = withSpring(targetY, springs.stiff);
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
        scale.value = withSpring(1.15, springs.bouncy);
        rotation.value = withSpring(4, springs.bouncy);
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
          Math.min(maxRows - 1, Math.round((y.value - verticalOffset) / rowHeight))
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
        scale.value = withSpring(1, springs.stiff);
        rotation.value = withSpring(0, springs.stiff);
        zIndex.value = 1;
        lastSwappedIndex.value = -1;
        runOnJS(setScrollEnabled)(true);
        runOnJS(onDragEnd)();
      });
  }, [
    item.id,
    index,
    gridColumns,
    maxRows,
    itemWidth,
    rowHeight,
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
    height: rowHeight,
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
              key={item.app.packageName}
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

export interface AppGridProps {
  apps: AppInfo[];
  folders?: FolderInfo[];
  isTodoExpanded?: boolean;
  onPress: (app: AppInfo) => void;
  onLongPress: (app: AppInfo) => void;
  onFolderPress?: (folder: FolderInfo) => void;
  onFolderLongPress?: (folder: FolderInfo) => void;
  onAllAppsPress?: () => void;
}

export function AppGrid({
  apps,
  folders = [],
  isTodoExpanded = false,
  onPress,
  onLongPress,
  onFolderPress,
  onFolderLongPress,
  onAllAppsPress,
}: AppGridProps) {
  const { colors, isDark } = useTheme();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const gridColumns = useSettingsStore((s) => s.gridColumns);
  const setAllowedPackages = useAppStore((s) => s.setAllowedPackages);

  const [measuredHeight, setMeasuredHeight] = useState(isTodoExpanded ? 240 : 380);
  const [activePage, setActivePage] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const isAnyDragging = useSharedValue(false);

  // Combine folders and apps into unified grid items with strict deduplication
  const combinedItems: GridItemData[] = useMemo(() => {
    const folderItems: GridItemData[] = folders.map((f) => ({
      id: f.id,
      type: "folder",
      folder: f,
    }));
    const seen = new Set<string>();
    const appItems: GridItemData[] = [];
    for (const a of apps) {
      if (!seen.has(a.packageName)) {
        seen.add(a.packageName);
        appItems.push({
          id: a.packageName,
          type: "app",
          app: a,
        });
      }
    }
    return [...folderItems, ...appItems];
  }, [folders, apps]);

  const [orderedItems, setOrderedItems] = useState<GridItemData[]>(combinedItems);
  const orderedItemsRef = useRef<GridItemData[]>(combinedItems);

  useEffect(() => {
    orderedItemsRef.current = combinedItems;
    setOrderedItems(combinedItems);
  }, [combinedItems]);

  // Lock ROWS_PER_PAGE on first measurement so PAGE_SIZE never changes when
  // the widget expands/collapses — only rowHeight compresses/expands.
  // This prevents apps from jumping between pages.
  const lockedRowsRef = useRef<number | null>(null);

  const numPagesEstimated = Math.max(1, Math.ceil(orderedItems.length / (gridColumns * 3)));
  const FOOTER_HEIGHT = onAllAppsPress
    ? numPagesEstimated > 1
      ? 64
      : 44
    : numPagesEstimated > 1
    ? 22
    : 0;

  const availableGridHeight = Math.max(70, measuredHeight - FOOTER_HEIGHT);

  // Compute ideal rows from current height
  const idealRows = Math.max(1, Math.min(4, Math.floor(availableGridHeight / 70)));

  // Lock on first valid measurement (collapsed state gives us the max rows)
  if (lockedRowsRef.current === null && measuredHeight > 100) {
    lockedRowsRef.current = idealRows;
  }

  // Use locked rows if available, otherwise use ideal
  const ROWS_PER_PAGE = lockedRowsRef.current ?? idealRows;

  // rowHeight adapts to available space but PAGE_SIZE stays constant
  const rowHeight = Math.min(BASE_ROW_HEIGHT, Math.floor(availableGridHeight / ROWS_PER_PAGE));
  const PAGE_SIZE = gridColumns * ROWS_PER_PAGE;
  const numPages = Math.max(1, Math.ceil(orderedItems.length / PAGE_SIZE));

  const usableWidth = SCREEN_WIDTH - spacing.xl * 2;
  const itemWidth = usableWidth / gridColumns;

  const handleLayout = (e: any) => {
    const height = e.nativeEvent.layout.height;
    if (height > 0 && Math.abs(height - measuredHeight) > 4) {
      setMeasuredHeight(height);
    }
  };

  const handleScroll = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setActivePage((prev) => (prev !== page ? page : prev));
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
      <View style={[styles.scrollWrapper, { height: availableGridHeight }]}>
        <ScrollView
          horizontal
          pagingEnabled
          scrollEnabled={scrollEnabled}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          style={styles.scrollStyle}
        >
          {pages.map((pageItems, pageIndex) => {
            const pageRows = Math.max(1, Math.ceil(pageItems.length / gridColumns));
            const verticalOffset = Math.max(
              0,
              (availableGridHeight - pageRows * rowHeight) / 2
            );

            return (
              <View
                key={pageIndex}
                style={[
                  styles.pageContainer,
                  { width: SCREEN_WIDTH, height: availableGridHeight },
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
                      rowHeight={rowHeight}
                      gridColumns={gridColumns}
                      maxRows={ROWS_PER_PAGE}
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
      </View>

      {/* Grid Footer: All Apps pill button + Pagination dots */}
      <View style={styles.gridFooter}>
        {onAllAppsPress && (
          <Pressable
            onPress={onAllAppsPress}
            style={({ pressed }) => [
              styles.allAppsButton,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
              pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open all apps drawer"
          >
            <LayoutGrid size={15} color={colors.textPrimary} />
            <Text style={[styles.allAppsText, { color: colors.textPrimary }]}>
              All Apps
            </Text>
          </Pressable>
        )}

        {numPages > 1 && (
          <View style={styles.pageIndicator}>
            {(() => {
              const MAX_VISIBLE_DOTS = 6;
              let start = 0;
              let end = numPages;
              if (numPages > MAX_VISIBLE_DOTS) {
                start = Math.max(
                  0,
                  Math.min(
                    activePage - Math.floor(MAX_VISIBLE_DOTS / 2),
                    numPages - MAX_VISIBLE_DOTS
                  )
                );
                end = start + MAX_VISIBLE_DOTS;
              }
              return Array.from({ length: end - start }).map((_, idx) => {
                const i = start + idx;
                const isEdge =
                  numPages > MAX_VISIBLE_DOTS &&
                  (idx === 0 || idx === end - start - 1);
                const isActive = i === activePage;
                return (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isActive
                          ? "#FFFFFF"
                          : "rgba(255, 255, 255, 0.35)",
                        transform: [
                          { scale: isActive ? 1.3 : isEdge ? 0.65 : 1 },
                        ],
                      },
                    ]}
                  />
                );
              });
            })()}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  scrollWrapper: {
    width: "100%",
    overflow: "hidden",
  },
  scrollStyle: {
    flex: 1,
  },
  pageContainer: {
    position: "relative",
    overflow: "hidden",
  },
  gridItem: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  gridFooter: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 2,
    paddingBottom: 2,
  },
  allAppsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  allAppsText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    height: 14,
    width: "100%",
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
