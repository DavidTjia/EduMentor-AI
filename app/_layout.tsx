import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AppColors } from "@/constants/theme";

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL as string
);

export const unstable_settings = {
  initialRouteName: "login",
};

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <StatusBar style="dark" backgroundColor={AppColors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: AppColors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="ai-planning" />
        <Stack.Screen name="plan-detail" />
        <Stack.Screen name="cycle-result" />
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      </Stack>
    </ConvexProvider>
  );
}
