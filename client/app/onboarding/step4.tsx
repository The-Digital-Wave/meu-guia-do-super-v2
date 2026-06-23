import { View, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import { markOnboardingComplete } from "@/utils/onboarding";
import OnboardingStep from "@/components/OnboardingStep";
import { getImageAspectRatio } from "@/utils/imageAspectRatio";

const step4Image = require("../../src/assets/onboarding-step-4.jpeg");
const imageAspectRatio = getImageAspectRatio(step4Image);

async function completeOnboarding() {
  const saved = await markOnboardingComplete();
  if (saved) router.replace("/(auth)/login");
}

export default function Step4() {
  return (
    <OnboardingStep
      stepIndex={3}
      totalSteps={4}
      heading="Orientação passo a passo"
      body="Ao iniciar a navegação, o mapa destaca o caminho até cada item da sua lista em ordem otimizada — siga a rota e confirme cada coleta pelo caminho."
      ctaLabel="Começar Agora"
      onCta={completeOnboarding}
    >
      <View style={[styles.mock, { aspectRatio: imageAspectRatio }]}>
        <Image
          source={step4Image}
          style={styles.mockImage}
          resizeMode="contain"
          accessibilityLabel="Prévia da navegação passo a passo"
        />
      </View>
    </OnboardingStep>
  );
}
const styles = StyleSheet.create({
  mock: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  mockImage: { width: "100%", height: "100%" },
});
