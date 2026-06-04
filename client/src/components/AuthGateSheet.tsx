import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { router } from "expo-router";
import { colors, spacing } from "@/theme/tokens";

interface AuthGateSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onContinueWithoutSaving?: () => void;
}

export default function AuthGateSheet({
  visible,
  onDismiss,
  onContinueWithoutSaving,
}: AuthGateSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss} accessibilityLabel="Fechar" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Crie uma conta para salvar sua lista</Text>
        <Text style={styles.body}>
          Com uma conta, suas listas de compras ficam salvas e disponíveis em qualquer dispositivo.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          onPress={() => { onDismiss(); router.push("/(auth)/register"); }}
          accessibilityLabel="Criar conta"
        >
          <Text style={styles.ctaText}>CRIAR CONTA</Text>
        </Pressable>

        <Pressable
          style={styles.loginBtn}
          onPress={() => { onDismiss(); router.push("/(auth)/login"); }}
          accessibilityLabel="Entrar"
        >
          <Text style={styles.loginBtnText}>Entrar</Text>
        </Pressable>

        {onContinueWithoutSaving && (
          <Pressable style={styles.skipBtn} onPress={onContinueWithoutSaving} accessibilityLabel="Continuar sem salvar">
            <Text style={styles.skipBtnText}>Continuar sem salvar</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.gutter + 4,
    paddingBottom: spacing.safeAreaBottom + 16,
    gap: 16,
  },
  handle: { width: 48, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "700", color: colors.brandDark, letterSpacing: -0.3 },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  cta: { backgroundColor: colors.brandVibrant, borderRadius: spacing.pillRadius, paddingVertical: 14, alignItems: "center" },
  ctaText: { fontSize: 13, fontWeight: "900", color: colors.brandDark, letterSpacing: 2 },
  loginBtn: { alignItems: "center", paddingVertical: 8 },
  loginBtnText: { fontSize: 14, fontWeight: "600", color: colors.routeActive },
  skipBtn: { alignItems: "center", paddingVertical: 4 },
  skipBtnText: { fontSize: 12, color: colors.textSecondary, textDecorationLine: "underline" },
});
