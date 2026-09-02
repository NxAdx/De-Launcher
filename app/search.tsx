import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { BlurView } from "expo-blur";
import { Settings, Home, Shield, Smartphone, Search, X } from "lucide-react-native";
import Animated, { FadeIn, FadeOut, SlideInUp } from "react-native-reanimated";
import { useTheme } from "@/src/theme/ThemeContext";
import { typography, spacing } from "@/src/theme/tokens";
import { useAppStore } from "@/src/store/appStore";
import { CommandItem, performSearch } from "@/src/services/commandEngine";
import { isKnownDistraction } from "@/src/services/appManager";
import { signalNavigation } from "./_layout";
import { AppIcon } from "@/src/components/AppIcon";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function SearchScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const installedApps = useAppStore((s) => s.installedApps);
  const [query, setQuery] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Auto-focus with slight delay for modal transition
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const results = useMemo(() => {
    return performSearch(query, installedApps);
  }, [query, installedApps]);

  const renderIcon = (item: CommandItem) => {
    if (item.type === "app" && item.appInfo) {
      return (
        <View style={styles.iconContainer}>
          <AppIcon
            key={item.appInfo.packageName}
            app={item.appInfo}
            size={32}
            showLabel={false}
            onPress={() => {}}
          />
        </View>
      );
    }
    
    // Fallback for actions
    const iconSize = 24;
    const iconColor = colors.textPrimary;
    let IconComponent = Settings;

    if (item.iconName === "Home") IconComponent = Home;
    else if (item.iconName === "Shield") IconComponent = Shield;
    else if (item.iconName === "Smartphone") IconComponent = Smartphone;

    return (
      <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }]}>
        <IconComponent size={iconSize} color={iconColor} />
      </View>
    );
  };

  const handleExecuteItem = useCallback((item: CommandItem) => {
    Keyboard.dismiss();
    try {
      if (item.type === "app" && item.appInfo) {
        const pkg = item.appInfo.packageName;
        const schedule = useAppStore.getState().isAppWithinSchedule(pkg);
        if (!schedule.allowed) {
          signalNavigation();
          router.push(
            `/intent-pause?pkg=${pkg}&reason=${encodeURIComponent(
              schedule.reason || ""
            )}` as any
          );
          return;
        }

        const state = useAppStore.getState().getAppFocusState(pkg);
        const distraction = isKnownDistraction(pkg);
        const hasExemption = useAppStore.getState().hasActiveExemption(pkg);

        if (
          (state === "intent_pause" || state === "blocked" || distraction) &&
          !hasExemption
        ) {
          signalNavigation();
          router.push(`/intent-pause?pkg=${pkg}` as any);
          return;
        }

        signalNavigation();
        item.action();
        setTimeout(() => {
          try {
            if (router.canGoBack()) router.back();
          } catch {}
        }, 100);
        return;
      }

      item.action();
      if (item.type === "action") {
        signalNavigation();
        setTimeout(() => {
          try {
            if (router.canGoBack()) router.back();
          } catch {}
        }, 100);
      }
    } catch (err) {
      console.error("[Search] Failed to execute item:", err);
    }
  }, []);

  const handleKeyboardSubmit = useCallback(() => {
    if (results && results.length > 0) {
      handleExecuteItem(results[0]);
    }
  }, [results, handleExecuteItem]);

  const renderItem = ({ item }: { item: CommandItem }) => {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.resultItem,
          pressed && { backgroundColor: "rgba(255,255,255,0.05)" },
        ]}
        onPress={() => handleExecuteItem(item)}
      >
        {renderIcon(item)}
        <View style={styles.resultTextContainer}>
          <Text style={[styles.resultTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.subtitle ? (
            <Text style={[styles.resultSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AnimatedBlurView 
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        intensity={isDark ? 40 : 80}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill} 
      />
      
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />

      <Animated.View 
        entering={SlideInUp.duration(300).springify()}
        style={[
          styles.content, 
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }
        ]}
        pointerEvents="box-none"
      >
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={20} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Search apps, commands..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="go"
            onSubmitEditing={handleKeyboardSubmit}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={12} style={styles.clearButton}>
              <X size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

        <View style={[styles.listContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <FlashList
            data={results}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: spacing.sm }}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No results found.</Text>
            }
          />
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  clearButton: {
    padding: spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: typography.family.medium,
    fontSize: typography.size.lg,
    height: "100%",
  },
  listContainer: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    marginRight: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  resultTitle: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
  },
  resultSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    marginTop: spacing.xl,
  },
});
