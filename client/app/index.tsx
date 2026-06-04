import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { storage } from "@/services/storage";
import { useAuthStore } from "@/stores/useAuthStore";

export default function BootRouter() {
  const router = useRouter();

  useEffect(() => {
    async function boot() {
      try {
        const onboardingDone = await storage.getItem("onboarding_complete");
        if (!onboardingDone) {
          router.replace("/onboarding/step1" as any);
          return;
        }
        // _layout.tsx already called restoreSession() — just read current state
        const { isAuthenticated, isGuest } = useAuthStore.getState();
        if (isAuthenticated || isGuest) {
          router.replace("/(app)");
        } else {
          router.replace("/(auth)/login");
        }
      } catch {
        // Storage failure — fall through to login
        router.replace("/(auth)/login");
      }
    }
    boot();
  }, [router]);

  return <View style={{ flex: 1 }} />;
}
