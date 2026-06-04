import { useState } from "react";
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { colors, spacing } from "@/theme/tokens";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register, isLoading } = useAuthStore();

  async function handleRegister() {
    if (!email || !password) {
      Alert.alert("Campos obrigatórios", "Por favor, preencha o e-mail e a senha.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Senha fraca", "A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    try {
      await register(email, password);
      router.replace("/(app)");
    } catch {
      Alert.alert("Erro ao criar conta", "Este e-mail já está em uso.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Voltar">
          <Text style={styles.backBtnText}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Rápido, fácil, gratuito.</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>EMAIL</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Campo de e-mail"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>SENHA (mín. 8 caracteres)</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          accessibilityLabel="Campo de senha"
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed, isLoading && styles.ctaDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
        accessibilityLabel="Criar conta"
      >
        {isLoading
          ? <ActivityIndicator color={colors.brandDark} />
          : <Text style={styles.ctaText}>CRIAR CONTA</Text>
        }
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.loginLink}>
          Já tem conta? <Text style={styles.loginLinkBold}>Entrar</Text>
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight, paddingHorizontal: spacing.gutter, paddingTop: spacing.safeAreaTop + 16, paddingBottom: 32, gap: 20 },
  header: { gap: 4 },
  backBtnText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "700", color: colors.brandDark, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: colors.textSecondary },
  fieldGroup: { gap: 4 },
  fieldLabel: { fontSize: 10, fontWeight: "700", color: colors.textSecondary, letterSpacing: 2 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: colors.textPrimary },
  cta: { backgroundColor: colors.brandVibrant, borderRadius: spacing.pillRadius, paddingVertical: 14, alignItems: "center" },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { fontSize: 13, fontWeight: "900", color: colors.brandDark, letterSpacing: 2 },
  loginLink: { fontSize: 12, textAlign: "center", color: colors.textSecondary },
  loginLinkBold: { color: colors.routeActive, fontWeight: "600" },
});
