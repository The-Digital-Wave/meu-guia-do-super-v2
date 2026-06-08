import { View, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import OnboardingStep from "@/components/OnboardingStep";

export default function Step1() {
  const heroImage = require("../../src/assets/hero.png");
  return (
    <OnboardingStep
      stepIndex={0}
      totalSteps={4}
      heading="Fim das voltas desnecessárias"
      body="Chega de perder horas no vai-vém pelos corredores atrás de itens. O seu assistente de compras inteligente — menos tempo entre as prateleiras, mais qualidade de vida."
      ctaLabel="Avançar"
      onCta={() => router.push("/onboarding/step2" as any)}
    >
      <View style={styles.iconCard}>
        <Image
          source={heroImage}
          style={styles.iconImage}
          resizeMode="cover"
          accessibilityLabel="Imagem principal do onboarding"
        />
      </View>
    </OnboardingStep>
  );
}
const styles = StyleSheet.create({
  iconCard: {
    width: 240,
    height: 240,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconImage: { width: "100%", height: "100%" },
});
