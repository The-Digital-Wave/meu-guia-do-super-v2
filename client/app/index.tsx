import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { storage } from "@/services/storage";
import { useAuthStore } from "@/stores/useAuthStore";

export default function BootRouter() {
  const router = useRouter();

  useEffect(() => {
    async function boot() {
      const onboardingDone = await storage.getItem("onboarding_complete");
      if (!onboardingDone) {
        router.replace("/onboarding/step1" as any);
        return;
      }
      // Restore session (non-blocking; restoreSession sets state in the store)
      await useAuthStore.getState().restoreSession();
      const { isAuthenticated, isGuest } = useAuthStore.getState();
      if (isAuthenticated || isGuest) {
        router.replace("/(app)");
      } else {
        router.replace("/(auth)/login");
      }
    }
    boot();
  }, []);

  return <View style={{ flex: 1 }} />;
}
