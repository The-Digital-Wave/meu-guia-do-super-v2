# Phase 8c — Shell Screens: Splash, Onboarding, Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the app boot flow — animated splash, 4-step onboarding (shown once per install, replayable from settings), redesigned login/register screens with new token set, and guest mode with `isGuest` in `useAuthStore`.

**Architecture:** Expo Router's root `app/index.tsx` acts as a boot controller reading the `onboarding_complete` flag from `storage` (expo-secure-store). Onboarding lives in `app/onboarding/` as a stack. Auth screens are rewritten in place. No new API calls in this phase — all local state.

**Tech Stack:** Expo Router, React Native, NativeWind, `expo-secure-store` (via `storage` service), Zustand

**Branch:** `feature/phase-8c-shell-screens` (cut from `feature/phase-8b-design-system` after it merges)

**Prerequisite:** Phase 8b merged (tokens.ts and Skia installed).

---

## File Map

| Action | Path |
|--------|------|
| Modify | `client/app/_layout.tsx` |
| Rewrite | `client/app/index.tsx` → boot router |
| Create | `client/app/splash.tsx` |
| Create | `client/app/onboarding/_layout.tsx` |
| Create | `client/app/onboarding/step1.tsx` |
| Create | `client/app/onboarding/step2.tsx` |
| Create | `client/app/onboarding/step3.tsx` |
| Create | `client/app/onboarding/step4.tsx` |
| Rewrite | `client/app/(auth)/login.tsx` |
| Rewrite | `client/app/(auth)/register.tsx` |
| Modify | `client/src/stores/useAuthStore.ts` |
| Create | `client/app/(app)/settings.tsx` |

---

## Task 1: Add `isGuest` to `useAuthStore`

**Files:**
- Modify: `client/src/stores/useAuthStore.ts`

- [ ] **Step 1: Update the store**

In `client/src/stores/useAuthStore.ts`, add `isGuest` to the interface and the initial state:

```typescript
interface AuthState {
  user: User | null;
  isGuest: boolean;           // ← add
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => void;   // ← add
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}
```

In the `create` call, add the initial value and the new action:

```typescript
isGuest: false,

loginAsGuest: () => set({ isGuest: true, user: null, isAuthenticated: false }),
```

Also update `logout` to reset `isGuest`:

```typescript
logout: async () => {
  await storage.deleteItem("access_token");
  await storage.deleteItem("refresh_token");
  set({ user: null, isAuthenticated: false, isGuest: false });
},
```

And update `login` to clear `isGuest` on successful login:

```typescript
// Inside login(), after set({ user: me, isAuthenticated: true }):
set({ user: me, isAuthenticated: true, isGuest: false });
```

- [ ] **Step 2: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/stores/useAuthStore.ts
git commit -m "feat(auth-store): add isGuest flag and loginAsGuest action"
```

---

## Task 2: Create the boot router

**Files:**
- Rewrite: `client/app/index.tsx`

- [ ] **Step 1: Write the boot router**

Replace `client/app/index.tsx` with:

```typescript
import { useEffect } from "react";
import { View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { storage } from "@/services/storage";
import { useAuthStore } from "@/stores/useAuthStore";

export default function BootRouter() {
  const router = useRouter();
  const { isAuthenticated, isGuest, restoreSession } = useAuthStore();

  useEffect(() => {
    async function boot() {
      const onboardingDone = await storage.getItem("onboarding_complete");
      if (!onboardingDone) {
        router.replace("/onboarding/step1");
        return;
      }
      await restoreSession();
      const { isAuthenticated: authed, isGuest: guest } = useAuthStore.getState();
      if (authed || guest) {
        router.replace("/(app)/");
      } else {
        router.replace("/(auth)/login");
      }
    }
    boot();
  }, []);

  // Render nothing while the boot check runs — Expo SplashScreen is still visible
  return <View style={{ flex: 1 }} />;
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add client/app/index.tsx
git commit -m "feat(boot): add boot router with onboarding flag check"
```

---

## Task 3: Create the splash screen

**Files:**
- Create: `client/app/splash.tsx`

- [ ] **Step 1: Write the splash screen**

Create `client/app/splash.tsx`:

```typescript
import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/theme/tokens";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Expo's built-in SplashScreen handles the initial hide — this component
    // is rendered after fonts are loaded, giving a ~1.5s branded boot feel.
    const timer = setTimeout(() => {
      router.replace("/");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo mark */}
      <View style={styles.logoWrap}>
        <View style={styles.logoBg}>
          <Text style={styles.logoIcon}>🛒</Text>
        </View>
        <Text style={styles.logoTitle}>
          Meu Guia{"\n"}
          <Text style={styles.logoAccent}>do Super</Text>
        </Text>
      </View>

      {/* Loading indicator */}
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.brandVibrant} size="small" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>

      {/* Footer */}
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
  logoBg: {
    width: 80,
    height: 80,
    backgroundColor: colors.brandVibrant,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: { fontSize: 40 },
  logoTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.white,
    textAlign: "center",
    lineHeight: 32,
  },
  logoAccent: { color: colors.brandVibrant },
  loadingWrap: { alignItems: "center", gap: 12 },
  loadingText: {
    color: colors.brandVibrant,
    fontSize: 11,
    fontFamily: "Courier New",
    letterSpacing: 2,
    opacity: 0.75,
  },
  footer: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    fontFamily: "Courier New",
    letterSpacing: 1,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add client/app/splash.tsx
git commit -m "feat(splash): add branded splash screen"
```

---

## Task 4: Create onboarding layout and steps

**Files:**
- Create: `client/app/onboarding/_layout.tsx`
- Create: `client/app/onboarding/step1.tsx`
- Create: `client/app/onboarding/step2.tsx`
- Create: `client/app/onboarding/step3.tsx`
- Create: `client/app/onboarding/step4.tsx`

- [ ] **Step 1: Create shared onboarding step component helper**

First, create `client/src/components/OnboardingStep.tsx`:

```typescript
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { colors, spacing, typography } from "@/theme/tokens";
import { storage } from "@/services/storage";

interface OnboardingStepProps {
  stepIndex: number;        // 0-based
  totalSteps: number;
  icon: string;
  heading: string;
  body: string;
  ctaLabel: string;
  onCta: () => void;
  children?: React.ReactNode;  // optional visual area between icon and text
}

async function skipOnboarding() {
  await storage.setItem("onboarding_complete", "true");
  router.replace("/(auth)/login");
}

export default function OnboardingStep({
  stepIndex, totalSteps, icon, heading, body, ctaLabel, onCta, children,
}: OnboardingStepProps) {
  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.time}>09:41</Text>
        <Pressable onPress={skipOnboarding}>
          <Text style={styles.skip}>Pular →</Text>
        </Pressable>
      </View>

      {/* Visual area */}
      {children}

      {/* Text content */}
      <View style={styles.textBlock}>
        <Text style={styles.heading}>{heading}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === stepIndex && styles.dotActive]}
            />
          ))}
        </View>
        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={onCta}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandDark,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.safeAreaTop + 8,
    paddingBottom: 48,
    justifyContent: "space-between",
  },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  time: { fontSize: 11, fontFamily: "Courier New", color: colors.brandVibrant, letterSpacing: 2 },
  skip: { fontSize: 14, fontWeight: "500", color: "rgba(255,255,255,0.65)" },
  textBlock: { alignItems: "center", paddingHorizontal: 16 },
  heading: { fontSize: 24, fontWeight: "900", color: colors.brandVibrant, textAlign: "center" },
  body: { fontSize: 12, color: "rgba(255,255,255,0.75)", textAlign: "center", marginTop: 10, lineHeight: 18 },
  bottom: { alignItems: "center", gap: 24 },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.25)" },
  dotActive: { backgroundColor: colors.brandVibrant },
  cta: {
    width: "100%",
    backgroundColor: colors.brandVibrant,
    borderRadius: spacing.pillRadius,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  ctaText: { fontSize: 12, fontWeight: "900", color: colors.brandDark, letterSpacing: 1.5, textTransform: "uppercase" },
});
```

- [ ] **Step 2: Create onboarding layout**

Create `client/app/onboarding/_layout.tsx`:

```typescript
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
```

- [ ] **Step 3: Create step1.tsx**

```typescript
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import OnboardingStep from "@/components/OnboardingStep";
import { colors } from "@/theme/tokens";

export default function Step1() {
  return (
    <OnboardingStep
      stepIndex={0}
      totalSteps={4}
      icon="⏱"
      heading="Fim das voltas desnecessárias"
      body="Chega de perder horas no vai-vém pelos corredores. O seu assistente de compras inteligente — menos tempo entre as prateleiras, mais qualidade de vida."
      ctaLabel="Avançar"
      onCta={() => router.push("/onboarding/step2")}
    >
      <View style={styles.iconCard}>
        {/* Pulse animation placeholder — icon centred */}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  iconCard: {
    width: 80, height: 80,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginVertical: 16,
  },
});
```

- [ ] **Step 4: Create step2.tsx**

```typescript
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import OnboardingStep from "@/components/OnboardingStep";
import { colors } from "@/theme/tokens";

export default function Step2() {
  return (
    <OnboardingStep
      stepIndex={1}
      totalSteps={4}
      icon="🔍"
      heading="Busca integrada ao trajeto"
      body="Digite o produto desejado e veja instantaneamente a linha de rota ligando sua posição atual diretamente à prateleira exata."
      ctaLabel="Avançar"
      onCta={() => router.push("/onboarding/step3")}
    >
      {/* Minimal map mockup */}
      <View style={styles.mapMock} />
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  mapMock: {
    width: "100%",
    height: 110,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginVertical: 8,
  },
});
```

- [ ] **Step 5: Create step3.tsx**

```typescript
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import OnboardingStep from "@/components/OnboardingStep";
import { colors } from "@/theme/tokens";

export default function Step3() {
  const items = [
    { seq: "1º", label: "🥛 Leite", aisle: "Corredor A", active: true },
    { seq: "2º", label: "🧀 Queijo", aisle: "Corredor B", active: false },
    { seq: "3º", label: "🥩 Carne",  aisle: "Corredor C", active: false },
  ];

  return (
    <OnboardingStep
      stepIndex={2}
      totalSteps={4}
      icon="🗺"
      heading="Otimização de rota completa"
      body="Adicione múltiplos itens. Nosso algoritmo reorganiza a ordem de coleta para garantir a menor distância possível."
      ctaLabel="Avançar"
      onCta={() => router.push("/onboarding/step4")}
    >
      <View style={styles.listMock}>
        <Text style={styles.badge}>• Recalculando Ordem Inteligente</Text>
        {items.map((item) => (
          <View key={item.seq} style={[styles.row, item.active && styles.rowActive]}>
            <Text style={styles.rowSeq}>{item.seq}</Text>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={[styles.rowAisle, item.active && styles.rowAisleActive]}>{item.aisle}</Text>
          </View>
        ))}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  listMock: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 12,
    gap: 6,
    marginVertical: 8,
  },
  badge: { fontSize: 8, color: colors.brandVibrant, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", padding: 8, borderRadius: 10, gap: 8 },
  rowActive: { backgroundColor: "rgba(76,175,80,0.2)", borderWidth: 1, borderColor: "rgba(76,175,80,0.3)" },
  rowSeq: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontFamily: "Courier New", width: 24 },
  rowLabel: { color: colors.white, fontSize: 10, fontWeight: "700", flex: 1 },
  rowAisle: { color: "rgba(255,255,255,0.4)", fontSize: 10 },
  rowAisleActive: { color: colors.routeActive, fontWeight: "700" },
});
```

- [ ] **Step 6: Create step4.tsx (final onboarding step)**

```typescript
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { storage } from "@/services/storage";
import OnboardingStep from "@/components/OnboardingStep";
import { colors } from "@/theme/tokens";

async function completeOnboarding() {
  await storage.setItem("onboarding_complete", "true");
  router.replace("/(auth)/login");
}

export default function Step4() {
  return (
    <OnboardingStep
      stepIndex={3}
      totalSteps={4}
      icon="📍"
      heading="Orientação turn-by-turn 3D"
      body="Ao iniciar a navegação, o mapa inclina-se para uma visão em primeira pessoa, rotacionando suavemente conforme você anda para guiá-lo passo a passo."
      ctaLabel="Começar Agora"
      onCta={completeOnboarding}
    >
      <View style={styles.threeDMock}>
        <Text style={styles.mockLabel}>Transição Automática 2D → Axonométrica 3D</Text>
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  threeDMock: {
    width: "100%",
    height: 110,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 8,
    marginVertical: 8,
  },
  mockLabel: { color: "rgba(255,255,255,0.4)", fontSize: 8, letterSpacing: 1 },
});
```

- [ ] **Step 7: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add client/app/onboarding/ client/src/components/OnboardingStep.tsx
git commit -m "feat(onboarding): add 4-step onboarding flow with skip and completion flag"
```

---

## Task 5: Rewrite login screen

**Files:**
- Rewrite: `client/app/(auth)/login.tsx`

- [ ] **Step 1: Rewrite with new token set**

Replace the entire contents of `client/app/(auth)/login.tsx`:

```typescript
import { useState } from "react";
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { colors, spacing, typography } from "@/theme/tokens";

export default function LoginScreen() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginAsGuest, isLoading } = useAuthStore();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Campos obrigatórios", "Por favor, preencha o e-mail e a senha.");
      return;
    }
    try {
      await login(email, password);
      router.replace("/(app)/");
    } catch {
      Alert.alert("Erro ao entrar", "E-mail ou senha inválidos.");
    }
  }

  function handleGuest() {
    loginAsGuest();
    router.replace("/(app)/");
  }

  function handleSocialToast() {
    Alert.alert("Em breve", "Login social estará disponível em breve.");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={styles.logoBg}>
          <Text style={{ fontSize: 22 }}>🛒</Text>
        </View>
        <View>
          <Text style={styles.logoTitle}>Bem-vindo</Text>
          <Text style={styles.logoSub}>Aqui você encontra o que procura</Text>
        </View>
      </View>

      {/* Social buttons */}
      <View style={styles.socialGroup}>
        <Pressable style={styles.socialBtn} onPress={handleSocialToast}>
          <Text style={styles.socialBtnText}>f  Continue with Facebook</Text>
        </Pressable>
        <Pressable style={styles.socialBtn} onPress={handleSocialToast}>
          <Text style={styles.socialBtnText}>G  Continue with Google</Text>
        </Pressable>
      </View>

      <Text style={styles.orDivider}>OU</Text>

      {/* Email field */}
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
        />
      </View>

      {/* Password field */}
      <View style={styles.fieldGroup}>
        <View style={styles.passHeader}>
          <Text style={styles.fieldLabel}>SENHA</Text>
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.showPassBtn}>{showPassword ? "OCULTAR" : "MOSTRAR"}</Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholder="••••••••"
          autoComplete="password"
        />
      </View>

      {/* Primary CTA */}
      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading
          ? <ActivityIndicator color={colors.brandDark} />
          : <Text style={styles.ctaText}>ENTRAR</Text>
        }
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/register")}>
        <Text style={styles.registerLink}>
          Não tem conta? <Text style={styles.registerLinkBold}>Criar conta</Text>
        </Text>
      </Pressable>

      {/* Guest bypass */}
      <Pressable style={styles.guestBtn} onPress={handleGuest}>
        <Text style={styles.guestBtnText}>Entrar como convidado</Text>
      </Pressable>
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
    gap: 16,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  logoBg: {
    width: 48, height: 48,
    backgroundColor: colors.brandDark,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoTitle: { ...typography.h2, color: colors.brandDark },
  logoSub: { ...typography.meta, color: colors.textSecondary },
  socialGroup: { gap: 8 },
  socialBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  socialBtnText: { ...typography.meta, fontWeight: "600", color: colors.textPrimary },
  orDivider: {
    textAlign: "center",
    ...typography.meta,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  fieldGroup: { gap: 4 },
  fieldLabel: { ...typography.badge, color: colors.textSecondary, letterSpacing: 2 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    ...typography.body,
    color: colors.textPrimary,
  },
  passHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  showPassBtn: { ...typography.badge, color: colors.routeActive, letterSpacing: 1 },
  cta: {
    backgroundColor: colors.brandVibrant,
    borderRadius: spacing.pillRadius,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  ctaText: { ...typography.badge, fontSize: 13, color: colors.brandDark, letterSpacing: 2 },
  registerLink: { ...typography.meta, textAlign: "center", color: colors.textSecondary },
  registerLinkBold: { color: colors.routeActive, fontWeight: "600" },
  guestBtn: { alignItems: "center", marginTop: "auto" },
  guestBtnText: { ...typography.meta, fontWeight: "700", color: colors.brandDark, textDecorationLine: "underline", letterSpacing: 1 },
});
```

- [ ] **Step 2: Commit**

```bash
git add client/app/(auth)/login.tsx
git commit -m "feat(auth): rewrite login screen with new design tokens + guest mode"
```

---

## Task 6: Rewrite register screen

**Files:**
- Rewrite: `client/app/(auth)/register.tsx`

- [ ] **Step 1: Rewrite register.tsx**

Replace the entire contents of `client/app/(auth)/register.tsx`:

```typescript
import { useState } from "react";
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { colors, spacing, typography } from "@/theme/tokens";

export default function RegisterScreen() {
  const [email, setEmail]       = useState("");
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
      router.replace("/(app)/");
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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
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
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={handleRegister}
        disabled={isLoading}
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
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.safeAreaTop + 16,
    paddingBottom: 32,
    gap: 20,
  },
  header: { gap: 4 },
  backBtn: { marginBottom: 8 },
  backBtnText: { ...typography.body, fontWeight: "600", color: colors.textSecondary },
  title: { ...typography.h1, color: colors.brandDark },
  subtitle: { ...typography.meta, color: colors.textSecondary },
  fieldGroup: { gap: 4 },
  fieldLabel: { ...typography.badge, color: colors.textSecondary, letterSpacing: 2 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    ...typography.body,
    color: colors.textPrimary,
  },
  cta: {
    backgroundColor: colors.brandVibrant,
    borderRadius: spacing.pillRadius,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  ctaText: { ...typography.badge, fontSize: 13, color: colors.brandDark, letterSpacing: 2 },
  loginLink: { ...typography.meta, textAlign: "center", color: colors.textSecondary },
  loginLinkBold: { color: colors.routeActive, fontWeight: "600" },
});
```

- [ ] **Step 2: Commit**

```bash
git add client/app/(auth)/register.tsx
git commit -m "feat(auth): rewrite register screen with new design tokens"
```

---

## Task 7: Create settings screen with tutorial replay

**Files:**
- Create: `client/app/(app)/settings.tsx`

- [ ] **Step 1: Create the settings screen**

Create `client/app/(app)/settings.tsx`:

```typescript
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { storage } from "@/services/storage";
import { useAuthStore } from "@/stores/useAuthStore";
import { colors, spacing, typography } from "@/theme/tokens";

export default function SettingsScreen() {
  const { logout } = useAuthStore();

  async function replayTutorial() {
    await storage.deleteItem("onboarding_complete");
    router.replace("/onboarding/step1");
  }

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Configurações</Text>

      {/* Tutorial replay */}
      <Pressable style={styles.row} onPress={replayTutorial}>
        <Text style={styles.rowLabel}>📖  Ver tutorial novamente</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      {/* Logout */}
      <Pressable style={[styles.row, styles.rowDanger]} onPress={handleLogout}>
        <Text style={styles.rowLabelDanger}>Sair da conta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
    paddingTop: spacing.safeAreaTop + 16,
    paddingHorizontal: spacing.gutter,
  },
  heading: { ...typography.h1, color: colors.brandDark, marginBottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: spacing.cardRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowLabel: { ...typography.body, color: colors.textPrimary },
  chevron: { ...typography.body, color: colors.textSecondary },
  rowDanger: { borderColor: "#fecaca", backgroundColor: "#fff5f5", marginTop: 24 },
  rowLabelDanger: { ...typography.body, color: "#ef4444", fontWeight: "600" },
});
```

- [ ] **Step 2: Commit**

```bash
git add client/app/(app)/settings.tsx
git commit -m "feat(settings): add settings screen with tutorial replay and logout"
```

---

## Task 8: Run CI checks and push

- [ ] **Step 1: TypeScript**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: ESLint**

```bash
cd client && npx eslint app/ src/ --max-warnings 0
```

Expected: no new errors.

- [ ] **Step 3: Push and open PR**

```bash
git push origin feature/phase-8c-shell-screens
```

Open PR from `feature/phase-8c-shell-screens` → `master`.
