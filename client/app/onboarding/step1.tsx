import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import OnboardingStep from "@/components/OnboardingStep";
import { colors } from "@/theme/tokens";

export default function Step1() {
  return (
    <OnboardingStep
      stepIndex={0} totalSteps={4}
      heading="Fim das voltas desnecessárias"
      body="Chega de perder horas no vai-vém pelos corredores atrás de itens. O seu assistente de compras inteligente — menos tempo entre as prateleiras, mais qualidade de vida."
      ctaLabel="Avançar"
      onCta={() => router.push("/onboarding/step2" as any)}
    >
      <View style={styles.iconCard} />
    </OnboardingStep>
  );
}
const styles = StyleSheet.create({
  iconCard: { width: 80, height: 80, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", alignSelf: "center" },
});
