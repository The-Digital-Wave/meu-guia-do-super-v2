import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { storage } from "@/services/storage";
import { useAuthStore } from "@/stores/useAuthStore";
import SplashContent from "./splash";

export default function BootRouter() {
  const router = useRouter();
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    async function boot() {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        // MVP demo mode: always replay onboarding for each app launch.
        // const onboardingDone = await storage.getItem("onboarding_complete");
        // if (!onboardingDone) {
        //   router.replace("/onboarding/step1" as any);
        //   return;
        // }
        router.replace("/onboarding/step1" as any);
        return;

        const { isAuthenticated, isGuest } = useAuthStore.getState();
        if (isAuthenticated || isGuest) {
          router.replace("/(app)");
        } else {
          router.replace("/(auth)/login");
        }
      } catch {
        router.replace("/(auth)/login");
      } finally {
        setBooted(true);
      }
    }
    boot();
  }, [router]);

  if (!booted) return <SplashContent />;

  return null;
}
