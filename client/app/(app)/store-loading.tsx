import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { useLayoutBundle } from "@/hooks/useLayouts";
import { colors, spacing } from "@/theme/tokens";

// Demo: Supermercado A maps to the seed layout id from MSW
const DEMO_LAYOUT_ID: Record<string, string> = {
  "super-001": "layout-001",
};

export default function StoreLoadingScreen() {
  const { supermarketId, supermarketName } = useLocalSearchParams<{
    supermarketId: string;
    supermarketName: string;
  }>();

  const { setActiveSupermarket } = useNavigationStore();
  const layoutId = DEMO_LAYOUT_ID[supermarketId] ?? null;
  const { data: bundle, isSuccess, isError } = useLayoutBundle(layoutId);

  useEffect(() => {
    if (isSuccess && bundle) {
      setActiveSupermarket(supermarketId, supermarketName ?? "");
      router.replace("/(app)/");
    }
  }, [isSuccess, bundle, supermarketId, supermarketName, setActiveSupermarket]);

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Carregando...</Text>
      </View>
      <Text style={styles.subText}>Aguarde o carregamento do layout</Text>

      {isError && (
        <View style={styles.errorBlock}>
          <Text style={styles.errorText}>Erro ao carregar o mapa.</Text>
          <Pressable onPress={() => router.back()} accessibilityLabel="Tentar novamente">
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brandDark, alignItems: "center", justifyContent: "center", gap: 16 },
  badge: { backgroundColor: colors.loadingYellow, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#b45309" },
  badgeText: { color: colors.brandDark, fontWeight: "700", fontSize: 12, fontFamily: "Courier New", letterSpacing: 2, textTransform: "uppercase" },
  subText: { fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "Courier New" },
  errorBlock: { alignItems: "center", gap: 8, marginTop: 16 },
  errorText: { fontSize: 14, color: "#ef4444" },
  retryText: { fontSize: 14, color: colors.brandVibrant, fontWeight: "700" },
});
