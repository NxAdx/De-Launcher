/**
 * AppIcon Component
 *
 * Renders a single app with its icon and optional label.
 * Performance & Polish:
 * - Synchronous memory cache checks to prevent layout shifts and flicker
 * - Dynamic size scaling with strict token bounds (Small, Medium, Large)
 * - Smooth spring press physics
 * - Fallback deterministic colored typography avatar
 */
import React, { useCallback, useEffect, useState, memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing, layout, springs } from "@/src/theme/tokens";
import { AppInfo } from "@/src/types/app";
import { useSettingsStore } from "@/src/store/settingsStore";
import {
  getIconFromPack,
  getCachedIcon,
  getSystemAppIcon,
  getCachedSystemIcon,
} from "@/src/services/appManager";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Deterministic color from package name
function getAvatarColor(packageName: string): string {
  const colors = [
    "#6366F1", "#8B5CF6", "#A78BFA", "#EC4899",
    "#F43F5E", "#EF4444", "#F97316", "#F59E0B",
    "#22C55E", "#14B8A6", "#06B6D4", "#3B82F6",
    "#2563EB", "#7C3AED", "#DB2777", "#059669",
  ];
  let hash = 0;
  for (let i = 0; i < packageName.length; i++) {
    hash = (hash * 31 + packageName.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(label: string): string {
  const words = label.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return label.slice(0, 2).toUpperCase();
}

interface AppIconProps {
  app: AppInfo;
  onPress: (app: AppInfo) => void;
  onLongPress?: (app: AppInfo) => void;
  size?: number;
  showLabel?: boolean;
}

export const AppIcon = memo(function AppIcon({
  app,
  onPress,
  onLongPress,
  size: sizeProp,
  showLabel: showLabelProp,
}: AppIconProps) {
  const { colors } = useTheme();
  const globalShowLabels = useSettingsStore((s) => s.showLabels);
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);
  const activeIconPack = useSettingsStore((s) => s.activeIconPack);
  const iconSizeOption = useSettingsStore((s) => s.iconSize);

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
  const opacity = useSharedValue(1);

  // Synchronous cache checks on current app.packageName
  const syncCustomIcon = activeIconPack ? getCachedIcon(activeIconPack, app.packageName) : undefined;
  const syncSystemIcon = getCachedSystemIcon(app.packageName) ?? app.icon ?? undefined;

  // Package-keyed async state prevents recycled cells from displaying another app's icon
  const [asyncCustomIcon, setAsyncCustomIcon] = useState<{ pkg: string; pack: string; uri: string | null } | null>(null);
  const [asyncSystemIcon, setAsyncSystemIcon] = useState<{ pkg: string; uri: string | null } | null>(null);

  // Load custom icon from icon pack when pack or package changes
  useEffect(() => {
    if (!activeIconPack) return;

    const cached = getCachedIcon(activeIconPack, app.packageName);
    if (cached !== undefined) return;

    let isMounted = true;
    getIconFromPack(activeIconPack, app.packageName).then((icon) => {
      if (isMounted) {
        setAsyncCustomIcon({ pkg: app.packageName, pack: activeIconPack, uri: icon });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeIconPack, app.packageName]);

  // Load system icon on-demand if not already cached
  useEffect(() => {
    const cached = getCachedSystemIcon(app.packageName);
    if (cached !== undefined || app.icon) return;

    let isMounted = true;
    getSystemAppIcon(app.packageName).then((icon) => {
      if (isMounted) {
        setAsyncSystemIcon({ pkg: app.packageName, uri: icon });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [app.packageName, app.icon]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, springs.snappy);
    opacity.value = withSpring(0.85, springs.snappy);
  }, [scale, opacity]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springs.snappy);
    opacity.value = withSpring(1, springs.snappy);
  }, [scale, opacity]);

  const handlePress = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress(app);
  }, [app, hapticEnabled, onPress]);

  const handleLongPress = useCallback(() => {
    if (!onLongPress) return;
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLongPress(app);
  }, [app, hapticEnabled, onLongPress]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const customIcon =
    syncCustomIcon !== undefined
      ? syncCustomIcon
      : asyncCustomIcon?.pkg === app.packageName && asyncCustomIcon?.pack === activeIconPack
      ? asyncCustomIcon.uri
      : null;

  const systemIcon =
    syncSystemIcon !== undefined
      ? syncSystemIcon
      : asyncSystemIcon?.pkg === app.packageName
      ? asyncSystemIcon.uri
      : app.icon;

  const iconSource = customIcon || systemIcon || app.icon;
  const avatarBg = getAvatarColor(app.packageName);
  const initials = getInitials(app.label);

  const borderRadius = Math.round(size * 0.28);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animStyle]}
      accessibilityRole="button"
      accessibilityLabel={`Launch ${app.label}`}
    >
      <View
        style={[
          styles.iconWrapper,
          {
            width: size,
            height: size,
            borderRadius,
          },
        ]}
      >
        {iconSource ? (
          <Image
            source={{ uri: iconSource }}
            style={[
              styles.iconImage,
              {
                width: size,
                height: size,
                borderRadius,
              },
            ]}
            contentFit="contain"
            cachePolicy="memory-disk"
            priority="high"
            recyclingKey={app.packageName}
            transition={0}
          />
        ) : (
          <View
            style={[
              styles.fallbackAvatar,
              {
                width: size,
                height: size,
                borderRadius,
                backgroundColor: avatarBg,
              },
            ]}
          >
            <Text
              style={[
                styles.initials,
                {
                  fontSize: Math.round(size * 0.36),
                },
              ]}
            >
              {initials}
            </Text>
          </View>
        )}
      </View>

      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              color: colors.textPrimary,
              fontSize: typography.size.xs,
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {app.label}
        </Text>
      )}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xs,
    minWidth: 64,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconImage: {
    backgroundColor: "transparent",
  },
  fallbackAvatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: typography.family.bold,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  label: {
    marginTop: spacing.xs,
    fontFamily: typography.family.medium,
    textAlign: "center",
    maxWidth: 76,
  },
});
