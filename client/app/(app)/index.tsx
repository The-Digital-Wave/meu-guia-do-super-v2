import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { colors, spacing } from "@/theme/tokens";

export default function HomeScreen() {
  const { activeSupermarketId, activeSupermarketName } = useNavigationStore();
  const hasStore = !!activeSupermarketId;

  function handleFabPress() {
    // Guest auth gate will be handled in Phase 8e
    router.push("/(app)/list");
  }

  return (
    <View style={styles.container}>
      {/* Top nav */}
      <View style={styles.navBar}>
        <View style={styles.logoWrap}>
          <View style={styles.logoBg}>
            <Text style={{ fontSize: 14 }}>🛒</Text>
          </View>
          <Text style={styles.logoText}>Meu Guia{"\n"}do Super</Text>
        </View>

        <Pressable
          style={[styles.storePicker, hasStore && styles.storePickerActive]}
          onPress={() => router.push("/(app)/store-select" as any)}
          accessibilityLabel="Selecionar supermercado"
        >
          <Text style={styles.storePickerText} numberOfLines={1}>
            {hasStore ? activeSupermarketName : "Selecione um supermercado"}
          </Text>
          <Text style={styles.storePickerArrow}>{hasStore ? "↑" : "↓"}</Text>
        </Pressable>

        <Pressable
          style={styles.avatar}
          onPress={() => router.push("/(app)/settings")}
          accessibilityLabel="Configurações"
        >
          <Text style={styles.avatarText}>EU</Text>
        </Pressable>
      </View>

      {/* Body */}
      {!hasStore ? <EmptyState /> : <LoadedState />}

      {/* Cart FAB */}
      <Pressable
        style={[styles.fab, !hasStore && styles.fabDisabled]}
        disabled={!hasStore}
        onPress={handleFabPress}
        accessibilityLabel="Ver lista de compras"
      >
        <Text style={styles.fabIcon}>🛒</Text>
        <View style={styles.fabBadge}>
          <Text style={styles.fabBadgeText}>0</Text>
        </View>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🗺</Text>
      <Text style={styles.emptyText}>Nenhum supermercado selecionado.</Text>
    </View>
  );
}

function LoadedState() {
  return (
    <View style={styles.loadedContainer}>
      {/* Map canvas placeholder — will be replaced with SkiaMapCanvas in Phase 8f */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>Mapa (Phase 8f)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  navBar: {
    backgroundColor: colors.white,
    paddingTop: spacing.safeAreaTop + 8,
    paddingBottom: 12,
    paddingHorizontal: spacing.gutter,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoWrap: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 80 },
  logoBg: { width: 24, height: 24, backgroundColor: colors.brandDark, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 9, fontWeight: "900", color: colors.brandDark, lineHeight: 12 },
  storePicker: { flex: 1, backgroundColor: colors.bgLight, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  storePickerActive: { borderColor: colors.routeActive, backgroundColor: colors.white },
  storePickerText: { fontSize: 11, fontWeight: "600", color: colors.textPrimary, flex: 1 },
  storePickerArrow: { fontSize: 11, color: colors.textSecondary, marginLeft: 4 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 8, fontWeight: "700", color: colors.textSecondary },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIcon: { fontSize: 48, opacity: 0.3 },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  loadedContainer: { flex: 1 },
  mapPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", margin: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" },
  mapPlaceholderText: { fontSize: 12, color: colors.textMeta },
  fab: { position: "absolute", bottom: spacing.safeAreaBottom + 16, right: 16, width: 52, height: 52, borderRadius: 16, backgroundColor: colors.brandDark, alignItems: "center", justifyContent: "center" },
  fabDisabled: { opacity: 0.5 },
  fabIcon: { fontSize: 22 },
  fabBadge: { position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: "#06b6d4", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.white },
  fabBadgeText: { fontSize: 9, fontWeight: "900", color: colors.white },
});
