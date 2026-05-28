import { View, Text, TextInput, Pressable, Image, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/useAuthStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Preencha todos os campos");
      return;
    }
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace("/(app)");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Email ou senha incorretos");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-neutralWarm"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-outerGutter pt-16 pb-8 justify-center">
          {/* Logo */}
          <View className="items-center mb-8">
            <Image
              source={require("../../src/assets/app-logo-1.png")}
              style={{ width: 80, height: 80, borderRadius: 16 }}
              resizeMode="contain"
            />
          </View>

          {/* Header */}
          <Text
            style={{ fontFamily: "Inter_600SemiBold", color: "#006241", fontSize: 28, letterSpacing: -0.16, textAlign: "center", marginBottom: 8 }}
          >
            Bem-vindo
          </Text>
          <Text
            style={{ fontFamily: "Inter_400Regular", color: "rgba(0,0,0,0.58)", fontSize: 14, textAlign: "center", marginBottom: 32 }}
          >
            Encontre o que você procura
          </Text>

          {/* Email input */}
          <View className="mb-4">
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "rgba(0,0,0,0.58)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor="rgba(0,0,0,0.38)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                borderWidth: 1,
                borderColor: "#d6dbde",
                borderRadius: 4,
                paddingHorizontal: 12,
                paddingVertical: 14,
                fontFamily: "Inter_400Regular",
                fontSize: 16,
                color: "rgba(0,0,0,0.87)",
                backgroundColor: "#ffffff",
                minHeight: 48,
              }}
            />
          </View>

          {/* Password input */}
          <View className="mb-6">
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "rgba(0,0,0,0.58)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Senha
            </Text>
            <View style={{ position: "relative" }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="rgba(0,0,0,0.38)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={{
                  borderWidth: 1,
                  borderColor: "#d6dbde",
                  borderRadius: 4,
                  paddingHorizontal: 12,
                  paddingRight: 48,
                  paddingVertical: 14,
                  fontFamily: "Inter_400Regular",
                  fontSize: 16,
                  color: "rgba(0,0,0,0.87)",
                  backgroundColor: "#ffffff",
                  minHeight: 48,
                }}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                style={{ position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" }}
              >
                <Text style={{ fontSize: 12, color: "#00754A", fontFamily: "Inter_600SemiBold" }}>
                  {showPassword ? "OCULTAR" : "MOSTRAR"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Error */}
          {error && (
            <Text style={{ color: "#c82014", fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 12, textAlign: "center" }}>
              {error}
            </Text>
          )}

          {/* Login button */}
          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            style={({ pressed }) => ({
              backgroundColor: "#00754A",
              borderRadius: 50,
              paddingVertical: 14,
              alignItems: "center",
              opacity: isLoading ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }],
              minHeight: 48,
            })}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ color: "#ffffff", fontFamily: "Inter_600SemiBold", fontSize: 16, letterSpacing: -0.16 }}>
                Entrar
              </Text>
            )}
          </Pressable>

          {/* Register link */}
          <Pressable
            onPress={() => router.push("/(auth)/register")}
            style={{ marginTop: 16, alignItems: "center", minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ color: "#00754A", fontFamily: "Inter_400Regular", fontSize: 14 }}>
              Não tem conta? <Text style={{ fontFamily: "Inter_600SemiBold" }}>Criar conta</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
