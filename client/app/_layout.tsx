import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useFonts, Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { useEffect } from "react";
import { SplashScreen } from "expo-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../src/global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });
  const restoreSession = useAuthStore((s) => s.restoreSession);

  // MSW disabled — backend is live; re-enable when BASE_URL in handlers.ts
  // is updated to match EXPO_PUBLIC_API_URL so requests are actually intercepted.

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
