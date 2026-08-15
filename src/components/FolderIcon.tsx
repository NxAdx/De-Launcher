/**
 * FolderIcon Component
 *
 * Renders a folder icon on the home screen with a 2x2 miniature app preview.
 * Strictly maintains exact dimensions and token alignment with AppIcon.
 */
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Folder } from "lucide-react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing, layout, springs } from "@/src/theme/tokens";
import { FolderInfo, AppInfo } from "@/src/types/app";
import { useSettingsStore } from "@/src/store/settingsStore";
import { useAppStore } from "@/src/store/appStore";
import { getCachedSystemIcon } from "@/src/services/appManager";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FolderIconProps {
  folder: FolderInfo;
  onPress: (folder: FolderInfo) => void;
  onLongPress?: (folder: FolderInfo) => void;
  size?: number;
  showLabel?: boolean;
}

export function FolderIcon({
  folder,
  onPress,
  onLongPress,
  size: sizeProp,
  showLabel: showLabelProp,
}: FolderIconProps) {
  const { colors, isDark } = useTheme();
  const globalShowLabels = useSettingsStore((s) => s.showLabels);
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);
  const iconSizeOption = useSettingsStore((s) => s.iconSize);
  const installedApps = useAppStore((s) => s.installedApps);

  const getBaseSize = () => {
    switch (iconSizeOption) {
      case "small":
        return 44;
      case "large":
        return 56;
      case "medium":
      default:
        return layout.appIconSize; // 48
    }
  };

  const size = sizeProp ?? getBaseSize();
  const showLabel = showLabelProp ?? globalShowLabels;
  const scale = useSharedValue(1);

  // Get up to 4 preview apps
  const folderApps = folder.packageNames
    .map((pkg) => installedApps.find((a) => a.packageName === pkg))
    .filter((a): a is AppInfo => !!a)
    .slice(0, 4);

  const handlePressIn = () => {
    scale.value = withSpring(0.92, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  const handlePress = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(folder);
  };

  const handleLongPress = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.(folder);
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const miniIconSize = Math.floor((size - 14) / 2);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animStyle]}
      accessibilityRole="button"
      accessibilityLabel={`Folder ${folder.name}, ${folder.packageNames.length} apps`}
    >
      <View
        style={[
          styles.iconBox,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.28),
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.06)",
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.12)"
              : "rgba(0, 0, 0, 0.08)",
          },
        ]}
      >
        {folderApps.length > 0 ? (
          <View style={styles.grid2x2}>
            {folderApps.map((app, idx) => {
              const iconUri = getCachedSystemIcon(app.packageName) || app.icon;
              return (
                <View
                  key={idx}
                  style={[
                    styles.miniIconWrapper,
                    { width: miniIconSize, height: miniIconSize },
                  ]}
                >
                  {iconUri ? (
                    <Image
                      source={{ uri: iconUri }}
                      style={{ width: miniIconSize, height: miniIconSize, borderRadius: 3 }}
                      contentFit="contain"
                    />
                  ) : (
                    <View
                      style={[
                        styles.miniDot,
                        { backgroundColor: colors.textSecondary },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <Folder size={Math.round(size * 0.44)} color={colors.textSecondary} />
        )}
      </View>

      {showLabel && (
        <Text
          style={[styles.label, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {folder.name}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xs,
    minWidth: 64,
  },
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  grid2x2: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
    gap: 3,
  },
  miniIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.7,
  },
  label: {
    marginTop: spacing.xs,
    fontSize: typography.size.xs,
    fontFamily: typography.family.medium,
    textAlign: "center",
    maxWidth: 72,
  },
});
