import { View, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import OnboardingStep from "@/components/OnboardingStep";

const step2Image = require("../../src/assets/contact-form.png");
const { width: imageWidth, height: imageHeight } =
  Image.resolveAssetSource(step2Image);
const imageAspectRatio =
  imageWidth && imageHeight ? imageWidth / imageHeight : 1;

export default function Step2() {
  return (
    <OnboardingStep
      stepIndex={1}
      totalSteps={4}
      heading="Busca integrada ao trajeto"
      body="Digite o produto desejado e veja instantaneamente a linha de rota ligando sua posição atual diretamente à prateleira exata."
      ctaLabel="Avançar"
      onCta={() => router.push("/onboarding/step3" as any)}
    >
      <View style={[styles.mapMock, { aspectRatio: imageAspectRatio }]}>
        <Image
          source={step2Image}
          style={styles.mapImage}
          resizeMode="contain"
          accessibilityLabel="Prévia da busca integrada ao trajeto"
        />
      </View>
    </OnboardingStep>
  );
}
const styles = StyleSheet.create({
  mapMock: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  mapImage: { width: "100%", height: "100%" },
});
