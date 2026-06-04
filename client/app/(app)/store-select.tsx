import { View, Text, Pressable, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useSupermarkets } from "@/hooks/useSupermarkets";
import type { Supermarket } from "@/types";
import { colors, spacing } from "@/theme/tokens";

const LOGO_COLORS = ["#2563EB", "#15803d", "#ca8a04"];

export default function StoreSelectScreen() {
  const { data: supermarkets, isLoading, isError } = useSupermarkets();

  function handleSelect(sm: Supermarket) {
    if (sm.slug !== "supermercado-a") return;
    router.replace({
      pathname: "/(app)/store-loading",
      params: { supermarketId: sm.id, supermarketName: sm.name },
    } as any);
  }

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.title}>Selecione o supermercado</Text>

      {isLoading && <ActivityIndicator color={colors.brandVibrant} style={{ marginTop: 24 }} />}

      {isError && (
        <Text style={styles.errorText}>Erro ao carregar supermercados. Tente novamente.</Text>
      )}

      {supermarkets && (
        <FlatList
          data={supermarkets}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item, index }) => {
            const hasLayout = item.slug === "supermercado-a";
            return (
              <Pressable
                style={[styles.row, !hasLayout && styles.rowDisabled]}
                onPress={() => handleSelect(item)}
                disabled={!hasLayout}
                accessibilityLabel={`Selecionar ${item.name}`}
              >
                <View style={[styles.logoCircle, { backgroundColor: LOGO_COLORS[index] ?? "#64748b" }]}>
                  <Text style={styles.logoInitial}>{item.name.charAt(item.name.length - 1)}</Text>
                </View>
                <Text style={[styles.rowName, !hasLayout && styles.rowNameDisabled]} numberOfLines={1}>
                  {item.name}
                </Text>
                {hasLayout && <Text style={styles.selectArrow}>← Selecionar</Text>}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingTop: 12, paddingHorizontal: spacing.gutter, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { width: 48, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", color: colors.brandDark, marginBottom: 16, letterSpacing: -0.3 },
  separator: { height: 1, backgroundColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  rowDisabled: { opacity: 0.55 },
  logoCircle: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  logoInitial: { color: colors.white, fontSize: 11, fontWeight: "700" },
  rowName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, flex: 1 },
  rowNameDisabled: { color: colors.textSecondary },
  selectArrow: { fontSize: 12, color: colors.routeActive, fontWeight: "700" },
  errorText: { fontSize: 14, color: "#ef4444", textAlign: "center", marginTop: 16 },
});
