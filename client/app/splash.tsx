import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, spacing } from "@/theme/tokens";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <View style={styles.logoBg}>
          <Text style={styles.logoIcon}>🛒</Text>
        </View>
        <Text style={styles.logoTitle}>
          Meu Guia{"\n"}
          <Text style={styles.logoAccent}>do Super</Text>
        </Text>
      </View>

      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.brandVibrant} size="small" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>

      <Text style={styles.footer}>Powered by Vanguarda Digital</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandDark,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 96,
    paddingBottom: 32,
    paddingHorizontal: 32,
  },
  logoWrap: { alignItems: "center", gap: 16 },
  logoBg: { width: 80, height: 80, backgroundColor: colors.brandVibrant, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  logoIcon: { fontSize: 40 },
  logoTitle: { fontSize: 24, fontWeight: "700", color: colors.white, textAlign: "center", lineHeight: 32 },
  logoAccent: { color: colors.brandVibrant },
  loadingWrap: { alignItems: "center", gap: 12 },
  loadingText: { color: colors.brandVibrant, fontSize: 11, fontFamily: "Courier New", letterSpacing: 2, opacity: 0.75 },
  footer: { color: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "Courier New", letterSpacing: 1 },
});
