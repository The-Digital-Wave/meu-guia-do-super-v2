import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import SplashContent from "./splash";

export default function BootRouter() {
  const router = useRouter();
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    async function boot() {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        router.replace("/onboarding/step1" as any);
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
