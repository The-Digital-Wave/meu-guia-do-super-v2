import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "@/theme/tokens";

interface ConfirmationOverlayProps {
  onComplete: () => void;
}

export default function ConfirmationOverlay({ onComplete }: ConfirmationOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={styles.container}>
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.label}>COLETADO !</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    marginHorizontal: spacing.gutter,
    borderRadius: 12,
    backgroundColor: colors.actionPick,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
  },
  checkmark: { fontSize: 28, color: colors.white, fontWeight: "900" },
  label: { fontSize: 14, fontWeight: "900", color: colors.white, letterSpacing: 3, textTransform: "uppercase" },
});
