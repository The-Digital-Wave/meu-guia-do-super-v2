import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { storage } from "@/services/storage";
import OnboardingStep from "@/components/OnboardingStep";
import { colors } from "@/theme/tokens";

async function completeOnboarding() {
  await storage.setItem("onboarding_complete", "true");
  router.replace("/(auth)/login");
}

export default function Step4() {
  return (
    <OnboardingStep
      stepIndex={3} totalSteps={4}
      heading="Orientação turn-by-turn 3D"
      body="Ao iniciar a navegação, o mapa inclina-se para uma visão em primeira pessoa, rotacionando suavemente conforme você anda para guiá-lo passo a passo."
      ctaLabel="Começar Agora"
      onCta={completeOnboarding}
    >
      <View style={styles.mock}>
        <Text style={styles.mockLabel}>Transição Automática 2D → Axonométrica 3D</Text>
      </View>
    </OnboardingStep>
  );
}
const styles = StyleSheet.create({
  mock: { width: "100%", height: 110, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "flex-end", padding: 8 },
  mockLabel: { color: "rgba(255,255,255,0.4)", fontSize: 8, letterSpacing: 1 },
});
