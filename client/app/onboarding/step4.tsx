import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { markOnboardingComplete } from "@/utils/onboarding";
import OnboardingStep from "@/components/OnboardingStep";

async function completeOnboarding() {
  const saved = await markOnboardingComplete();
  if (saved) router.replace("/(auth)/login");
}

export default function Step4() {
  return (
    <OnboardingStep
      stepIndex={3} totalSteps={4}
      heading="Orientação passo a passo"
      body="Ao iniciar a navegação, o mapa destaca o caminho até cada item da sua lista em ordem otimizada — siga a rota e confirme cada coleta pelo caminho."
      ctaLabel="Começar Agora"
      onCta={completeOnboarding}
    >
      <View style={styles.mock}>
        <Text style={styles.mockLabel}>Navegação Turn-by-Turn 2D</Text>
      </View>
    </OnboardingStep>
  );
}
const styles = StyleSheet.create({
  mock: { width: "100%", height: 110, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "flex-end", padding: 8 },
  mockLabel: { color: "rgba(255,255,255,0.4)", fontSize: 8, letterSpacing: 1, textAlign: "center" },
});
