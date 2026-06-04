import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import OnboardingStep from "@/components/OnboardingStep";

export default function Step2() {
  return (
    <OnboardingStep
      stepIndex={1} totalSteps={4}
      heading="Busca integrada ao trajeto"
      body="Digite o produto desejado e veja instantaneamente a linha de rota ligando sua posição atual diretamente à prateleira exata."
      ctaLabel="Avançar"
      onCta={() => router.push("/onboarding/step3" as any)}
    >
      <View style={styles.mapMock} />
    </OnboardingStep>
  );
}
const styles = StyleSheet.create({
  mapMock: { width: "100%", height: 110, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
});
