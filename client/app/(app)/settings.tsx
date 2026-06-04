import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { storage } from "@/services/storage";
import { useAuthStore } from "@/stores/useAuthStore";
import { colors, spacing } from "@/theme/tokens";

export default function SettingsScreen() {
  const { logout } = useAuthStore();

  async function replayTutorial() {
    await storage.deleteItem("onboarding_complete");
    router.replace("/onboarding/step1" as any);
  }

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Configurações</Text>

      <Pressable style={styles.row} onPress={replayTutorial} accessibilityLabel="Ver tutorial novamente">
        <Text style={styles.rowLabel}>📖  Ver tutorial novamente</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={[styles.row, styles.rowDanger]} onPress={handleLogout} accessibilityLabel="Sair da conta">
        <Text style={styles.rowLabelDanger}>Sair da conta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight, paddingTop: spacing.safeAreaTop + 16, paddingHorizontal: spacing.gutter },
  heading: { fontSize: 24, fontWeight: "700", color: colors.brandDark, marginBottom: 24, letterSpacing: -0.5 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.white, borderRadius: spacing.cardRadius, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  rowLabel: { fontSize: 14, color: colors.textPrimary },
  chevron: { fontSize: 14, color: colors.textSecondary },
  rowDanger: { borderColor: "#fecaca", backgroundColor: "#fff5f5", marginTop: 24 },
  rowLabelDanger: { fontSize: 14, color: "#ef4444", fontWeight: "600" },
});
