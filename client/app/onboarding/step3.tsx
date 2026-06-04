import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import OnboardingStep from "@/components/OnboardingStep";
import { colors } from "@/theme/tokens";

const ITEMS = [
  { seq: "1º", label: "🥛 Leite", aisle: "Corredor A", active: true },
  { seq: "2º", label: "🧀 Queijo", aisle: "Corredor B", active: false },
  { seq: "3º", label: "🥩 Carne", aisle: "Corredor C", active: false },
];

export default function Step3() {
  return (
    <OnboardingStep
      stepIndex={2} totalSteps={4}
      heading="Otimização de rota completa"
      body="Adicione múltiplos itens. Nosso algoritmo reorganiza a ordem de coleta para garantir a menor distância possível."
      ctaLabel="Avançar"
      onCta={() => router.push("/onboarding/step4" as any)}
    >
      <View style={styles.list}>
        <Text style={styles.badge}>• Recalculando Ordem Inteligente</Text>
        {ITEMS.map((item) => (
          <View key={item.seq} style={[styles.row, item.active && styles.rowActive]}>
            <Text style={styles.seq}>{item.seq}</Text>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={[styles.aisle, item.active && styles.aisleActive]}>{item.aisle}</Text>
          </View>
        ))}
      </View>
    </OnboardingStep>
  );
}
const styles = StyleSheet.create({
  list: { width: "100%", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: 12, gap: 6 },
  badge: { fontSize: 8, color: colors.brandVibrant, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", padding: 8, borderRadius: 10, gap: 8 },
  rowActive: { backgroundColor: "rgba(76,175,80,0.2)", borderWidth: 1, borderColor: "rgba(76,175,80,0.3)" },
  seq: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontFamily: "Courier New", width: 24 },
  label: { color: colors.white, fontSize: 10, fontWeight: "700", flex: 1 },
  aisle: { color: "rgba(255,255,255,0.4)", fontSize: 10 },
  aisleActive: { color: colors.routeActive, fontWeight: "700" },
});
