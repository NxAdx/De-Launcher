/**
 * AppGrid Component
 *
 * Renders a responsive grid of app icons.
 * Uses FlashList for performance with large app lists.
 */
import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { AppIcon } from "./AppIcon";
import { AppInfo } from "@/src/types/app";
import { spacing, layout } from "@/src/theme/tokens";
import { useSettingsStore } from "@/src/store/settingsStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AppGridProps {
  apps: AppInfo[];
  onPress: (app: AppInfo) => void;
  onLongPress?: (app: AppInfo) => void;
}

export function AppGrid({ apps, onPress, onLongPress }: AppGridProps) {
  const gridColumns = useSettingsStore((s) => s.gridColumns);

  const itemWidth = useMemo(() => {
    const totalPadding = spacing.xl * 2;
    return (SCREEN_WIDTH - totalPadding) / gridColumns;
  }, [gridColumns]);

  const renderItem = useCallback(
    ({ item }: { item: AppInfo }) => (
      <View style={[styles.gridItem, { width: itemWidth }]}>
        <AppIcon
          app={item}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      </View>
    ),
    [itemWidth, onPress, onLongPress]
  );

  const keyExtractor = useCallback(
    (item: AppInfo) => item.packageName,
    []
  );

  return (
    <FlashList
      data={apps}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={gridColumns}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: layout.dockHeight + spacing.xl,
  },
  gridItem: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
});
