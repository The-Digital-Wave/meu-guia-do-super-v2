import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { colors, spacing } from "@/theme/tokens";
import { markOnboardingComplete } from "@/utils/onboarding";

interface OnboardingStepProps {
  stepIndex: number;
  totalSteps: number;
  heading: string;
  body: string;
  ctaLabel: string;
  onCta: () => void;
  children?: React.ReactNode;
}

async function skipOnboarding() {
  const saved = await markOnboardingComplete();
  if (saved) router.replace("/(auth)/login");
}

export default function OnboardingStep({
  stepIndex,
  totalSteps,
  heading,
  body,
  ctaLabel,
  onCta,
  children,
}: OnboardingStepProps) {
  const [ctaPressed, setCtaPressed] = useState(false);
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={skipOnboarding} accessibilityLabel="Pular tutorial">
          <Text style={styles.skip}>Pular →</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {children}
        <View style={styles.textBlock}>
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === stepIndex && styles.dotActive]}
            />
          ))}
        </View>
        <Pressable
          style={[styles.cta, ctaPressed && styles.ctaPressed]}
          onPressIn={() => setCtaPressed(true)}
          onPressOut={() => setCtaPressed(false)}
          onPress={onCta}
          accessibilityLabel={ctaLabel}
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
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  time: {
    fontSize: 11,
    fontFamily: "Courier New",
    color: colors.brandVibrant,
    letterSpacing: 2,
  },
  skip: { fontSize: 14, fontWeight: "500", color: "rgba(255,255,255,0.65)" },
  content: { flex: 1, justifyContent: "center", gap: 24 },
  textBlock: { alignItems: "center", paddingHorizontal: 16, gap: 10 },
  heading: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.brandVibrant,
    textAlign: "center",
  },
  body: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 18,
  },
  bottom: { alignItems: "center", gap: 24 },
  dots: { flexDirection: "row", gap: 8 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  dotActive: { backgroundColor: colors.brandVibrant },
  cta: {
    width: "100%",
    backgroundColor: colors.brandVibrant,
    borderRadius: spacing.pillRadius,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaPressed: { opacity: 0.82 },
  ctaText: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.brandDark,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
