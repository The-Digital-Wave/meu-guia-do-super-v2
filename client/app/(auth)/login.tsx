import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { colors, spacing } from "@/theme/tokens";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginAsGuest, isLoading } = useAuthStore();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert(
        "Campos obrigatórios",
        "Por favor, preencha o e-mail e a senha.",
      );
      return;
    }
    try {
      await login(email, password);
      router.replace("/(app)");
    } catch {
      Alert.alert("Erro ao entrar", "E-mail ou senha inválidos.");
    }
  }

  function handleGuest() {
    loginAsGuest();
    router.replace("/(app)");
  }

  function handleSocialToast() {
    Alert.alert("Em breve", "Login social estará disponível em breve.");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.logoRow}>
        <Image
          source={require("../../src/assets/app-logo-light-green-bg.png")}
          style={styles.logoImg}
        />
        <View>
          <Text style={styles.logoTitle}>Bem-vindo</Text>
          <Text style={styles.logoSub}>Aqui você encontra o que procura</Text>
        </View>
      </View>

      <View style={styles.formGroup}>
        <View style={styles.socialGroup}>
          <Pressable
            style={styles.socialBtn}
            onPress={handleSocialToast}
            accessibilityLabel="Continuar com Facebook"
          >
            <Text style={styles.socialBtnText}>f Continue with Facebook</Text>
          </Pressable>
          <Pressable
            style={styles.socialBtn}
            onPress={handleSocialToast}
            accessibilityLabel="Continuar com Google"
          >
            <Text style={styles.socialBtnText}>G Continue with Google</Text>
          </Pressable>
        </View>

        <Text style={styles.orDivider}>OU</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            accessibilityLabel="Campo de e-mail"
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.passHeader}>
            <Text style={styles.fieldLabel}>SENHA</Text>
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.showPassBtn}>
                {showPassword ? "OCULTAR" : "MOSTRAR"}
              </Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="••••••••"
            autoComplete="password"
            accessibilityLabel="Campo de senha"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.ctaTouch,
            pressed && styles.ctaPressed,
            isLoading && styles.ctaDisabled,
          ]}
          onPress={handleLogin}
          disabled={isLoading}
          accessibilityLabel="Entrar"
        >
          <View style={styles.cta}>
            {isLoading ? (
              <ActivityIndicator color={colors.brandDark} />
            ) : (
              <Text style={styles.ctaText}>ENTRAR</Text>
            )}
          </View>
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.registerLink}>
            Não tem conta?{" "}
            <Text style={styles.registerLinkBold}>Criar conta</Text>
          </Text>
        </Pressable>

        <Pressable
          onPress={handleGuest}
          accessibilityLabel="Entrar como convidado"
          style={{ marginTop: 16 }}
        >
          <Text style={styles.guestBtnText}>Entrar como convidado</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.safeAreaTop + 16,
    paddingBottom: 32,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  logoImg: { width: 48, height: 48, borderRadius: 12 },
  formGroup: { flex: 1, justifyContent: "center", gap: 16 },
  logoBg: {
    width: 48,
    height: 48,
    backgroundColor: colors.brandDark,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.brandDark,
    letterSpacing: -0.3,
  },
  logoSub: { fontSize: 12, color: colors.textSecondary },
  socialGroup: { gap: 8 },
  socialBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  socialBtnText: { fontSize: 12, fontWeight: "600", color: colors.textPrimary },
  orDivider: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  fieldGroup: { gap: 4 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.textPrimary,
  },
  passHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  showPassBtn: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.routeActive,
    letterSpacing: 1,
  },
  ctaTouch: {
    borderRadius: spacing.pillRadius,
    overflow: "hidden",
    marginTop: 4,
  },
  cta: {
    backgroundColor: colors.brandVibrant,
    borderRadius: spacing.pillRadius,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  ctaDisabled: { opacity: 0.4 },
  ctaText: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.brandDark,
    letterSpacing: 2,
  },
  registerLink: {
    fontSize: 12,
    textAlign: "center",
    color: colors.textSecondary,
  },
  registerLinkBold: { color: colors.routeActive, fontWeight: "600" },
  guestBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandDark,
    letterSpacing: 1,
    textAlign: "center",
  },
});
