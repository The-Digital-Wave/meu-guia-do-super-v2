import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, FlatList } from "react-native";
import { router } from "expo-router";
import { useGroceryListStore, type CartItem } from "@/stores/useGroceryListStore";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { colors, spacing } from "@/theme/tokens";

// react-native-reorderable-list may not yet be configured; use FlatList as fallback

export default function ListModal() {
  const { items, removeItem } = useGroceryListStore();
  const { activeRoute } = useNavigationStore();
  const [loading, setLoading] = useState(false);

  async function handleStartNavigation() {
    if (items.length === 0) return;
    setLoading(true);
    try {
      // If we already have a route from a previous session, go straight to map
      if (activeRoute) {
        router.replace("/(app)/map");
        return;
      }
      // Otherwise navigate to map — route will be calculated there
      router.replace("/(app)/map");
    } catch {
      Alert.alert("Erro", "Não foi possível calcular a rota. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      <View style={styles.header}>
        <Text style={styles.title}>Lista de Compras</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{items.length} {items.length === 1 ? "Item" : "Itens"}</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sua lista está vazia.</Text>
          <Text style={styles.emptySubText}>Pesquise produtos e adicione-os à lista.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item }: { item: CartItem }) => (
            <View style={styles.row}>
              <Text style={styles.rowEmoji}>🛍</Text>
              <Text style={styles.rowName} numberOfLines={1}>{item.product_name_snapshot}</Text>
              <Pressable
                onPress={() => removeItem(item.product_id)}
                style={styles.deleteBtn}
                accessibilityLabel={`Remover ${item.product_name_snapshot}`}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </Pressable>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      <Pressable
        style={({ pressed }) => [
          styles.cta,
          items.length === 0 && styles.ctaDisabled,
          pressed && items.length > 0 && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
        onPress={handleStartNavigation}
        disabled={items.length === 0 || loading}
        accessibilityLabel="Iniciar navegação"
      >
        {loading
          ? <ActivityIndicator color={colors.white} size="small" />
          : <Text style={styles.ctaText}>Iniciar navegação →</Text>
        }
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 12, paddingHorizontal: spacing.gutter, paddingBottom: spacing.safeAreaBottom + 16 },
  handle: { width: 48, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", color: colors.brandDark },
  countBadge: { backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#a7f3d0", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
  countText: { fontSize: 10, fontWeight: "700", color: "#059669" },
  list: { flex: 1, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, gap: 10 },
  rowEmoji: { fontSize: 18 },
  rowName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, flex: 1 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 14, color: "#ef4444", fontWeight: "600" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 48 },
  emptyText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  emptySubText: { fontSize: 12, color: colors.textSecondary, textAlign: "center" },
  cta: { backgroundColor: "#15803d", borderRadius: spacing.pillRadius, paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  ctaDisabled: { opacity: 0.35 },
  ctaText: { fontSize: 14, fontWeight: "700", color: colors.white, letterSpacing: 0.5 },
});
