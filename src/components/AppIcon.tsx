/**
 * AppIcon Component
 *
 * Renders a single app with its icon and optional label.
 * Uses the first two letters of the app name as a fallback when no icon is available.
 * Supports custom icons from icon packs.
 */
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing, layout } from "@/src/theme/tokens";
import { AppInfo } from "@/src/types/app";
import { useSettingsStore } from "@/src/store/settingsStore";
import { getIconFromPack, getCachedIcon, getSystemAppIcon, getCachedSystemIcon } from "@/src/services/appManager";

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

export function AppIcon({
  app,
  onPress,
  onLongPress,
  size = layout.appIconSize,
  showLabel: showLabelProp,
}: AppIconProps) {
  const { colors } = useTheme();
  const globalShowLabels = useSettingsStore((s) => s.showLabels);
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedback);
  const activeIconPack = useSettingsStore((s) => s.activeIconPack);
  const showLabel = showLabelProp ?? globalShowLabels;
  const scale = useSharedValue(1);
  const [customIcon, setCustomIcon] = useState<string | null>(() => {
    if (activeIconPack) {
      const cached = getCachedIcon(activeIconPack, app.packageName);
      if (cached !== undefined) return cached;
    }
    return null;
  });
  const [systemIcon, setSystemIcon] = useState<string | null>(() => {
    if (!activeIconPack) {
      const cached = getCachedSystemIcon(app.packageName);
      if (cached !== undefined) return cached;
    }
    return null;
  });
  const [loadedPack, setLoadedPack] = useState<string | null>(activeIconPack ?? null);

  // Load custom icon from icon pack when pack changes
  useEffect(() => {
    if (!activeIconPack) {
      setCustomIcon(null);
      setLoadedPack(null);
      return;
    }

    if (loadedPack === activeIconPack) return;

    // Check JS memory cache first
    const cached = getCachedIcon(activeIconPack, app.packageName);
    if (cached !== undefined) {
      setCustomIcon(cached);
      setLoadedPack(activeIconPack);
      return;
    }

    const loadCustomIcon = async () => {
      try {
        const icon = await getIconFromPack(activeIconPack, app.packageName);
        if (icon) {
          setCustomIcon(icon);
          setLoadedPack(activeIconPack);
        } else {
          setCustomIcon(null);
        }
      } catch (error) {
        console.warn(
          `Failed to load icon from pack for ${app.packageName}:`,
          error
        );
        setCustomIcon(null);
      }
    };

    loadCustomIcon();
  }, [activeIconPack, app.packageName, loadedPack]);

  // Load fallback system app icon lazily when active icon pack is disabled or not set
  useEffect(() => {
    if (activeIconPack) {
      setSystemIcon(null);
      return;
    }

    const cached = getCachedSystemIcon(app.packageName);
    if (cached !== undefined) {
      setSystemIcon(cached);
      return;
    }

    let isMounted = true;
    const loadSystemIcon = async () => {
      try {
        const icon = await getSystemAppIcon(app.packageName);
        if (icon && isMounted) {
          setSystemIcon(icon);
        }
      } catch (e) {
        // Ignore
      }
    };
    loadSystemIcon();
    return () => {
      isMounted = false;
    };
  }, [activeIconPack, app.packageName]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.88, { damping: 15, stiffness: 300, mass: 0.5 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.5 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress(app);
  }, [app, onPress, hapticEnabled]);

  const handleLongPress = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLongPress?.(app);
  }, [app, onLongPress, hapticEnabled]);

  const avatarBg = getAvatarColor(app.packageName);
  const appIconUri = app.icon?.startsWith("data:") || app.icon?.startsWith("file:")
    ? app.icon
    : app.icon
      ? `data:image/png;base64,${app.icon}`
      : null;

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={400}
    >
      {customIcon ? (
        <Image
          source={{ uri: customIcon }}
          style={[
            styles.icon,
            { width: size, height: size, borderRadius: size * 0.22 },
          ]}
        />
      ) : systemIcon ? (
        <Image
          source={{ uri: systemIcon }}
          style={[
            styles.icon,
            { width: size, height: size, borderRadius: size * 0.22 },
          ]}
        />
      ) : appIconUri ? (
        <Image
          source={{ uri: appIconUri }}
          style={[
            styles.icon,
            { width: size, height: size, borderRadius: size * 0.22 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size * 0.22,
              backgroundColor: avatarBg,
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              { fontSize: size * 0.32 },
            ]}
          >
            {getInitials(app.label)}
          </Text>
        </View>
      )}
      {showLabel && (
        <Text
          style={[styles.label, { color: colors.textSecondary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {app.label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    width: layout.appIconSize + spacing["2xl"],
  },
  icon: {
    resizeMode: "cover",
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: typography.family.semiBold,
    color: "#FFFFFF",
    includeFontPadding: false,
  },
  label: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    marginTop: spacing.xs,
    textAlign: "center",
    maxWidth: layout.appIconSize + spacing.xl,
  },
});
