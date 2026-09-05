import { Stack } from "expo-router";
import { useTheme } from "@/src/theme/ThemeContext";

export default function OnboardingLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="apps" />
      <Stack.Screen name="finish" />
    </Stack>
  );
}
