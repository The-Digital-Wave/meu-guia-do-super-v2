import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  FlatList,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProductSearch } from "@/hooks/useProducts";
import { useGroceryListStore } from "@/stores/useGroceryListStore";
import { useLayouts, useLayoutBundle } from "@/hooks/useLayouts";
import AuthGateSheet from "@/components/AuthGateSheet";
import SkiaMapCanvas from "@/components/map/SkiaMapCanvas";
import { colors, spacing } from "@/theme/tokens";
import type { Product } from "@/types";

export default function HomeScreen() {
  const { activeSupermarketId, activeSupermarketName } = useNavigationStore();
  const { isGuest } = useAuthStore();
  const hasStore = !!activeSupermarketId;

  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [navBarHeight, setNavBarHeight] = useState(0);
  const [pressedSearchItemId, setPressedSearchItemId] = useState<string | null>(
    null,
  );
  const searchInputRef = useRef<TextInput>(null);
  const { data: searchResults } = useProductSearch(query);
  const { addItem, items } = useGroceryListStore();

  const handleAddProduct = useCallback(
    (product: Product) => {
      addItem(product);
      // Keep dropdown open for rapid multi-select until input loses focus.
      setShowDropdown(true);
      searchInputRef.current?.focus();
    },
    [addItem],
  );

  const handleFabPress = useCallback(() => {
    if (isGuest) {
      setShowAuthGate(true);
    } else {
      router.push("/(app)/list");
    }
  }, [isGuest]);

  return (
    <View style={styles.container}>
      {/* Top nav */}
      <View
        style={styles.navBar}
        onLayout={(e) => setNavBarHeight(e.nativeEvent.layout.height)}
      >
        <View style={styles.logoWrap}>
          <Image
            source={require("../../src/assets/app-logo-light-green-bg.png")}
            style={styles.logoImage}
            resizeMode="cover"
            accessibilityLabel="Logo Meu Guia do Super"
          />
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

        {hasStore && (
          <View style={styles.searchWrap}>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setShowDropdown(text.length > 0);
              }}
              onBlur={() => setShowDropdown(false)}
              placeholder="Buscar produto..."
              placeholderTextColor={colors.textSecondary}
              returnKeyType="search"
              accessibilityLabel="Buscar produto"
            />
          </View>
        )}

        <Pressable
          style={styles.avatar}
          onPress={() => router.push("/(app)/settings")}
          accessibilityLabel="Configurações"
        >
          <Image
            source={require("../../src/assets/profile_fabio_1.jpeg")}
            style={styles.avatarImage}
            resizeMode="cover"
            accessibilityLabel="Avatar do Fabio"
          />
        </Pressable>
      </View>

      {/* Search dropdown */}
      {hasStore &&
        showDropdown &&
        query.length > 0 &&
        searchResults &&
        searchResults.items.length > 0 && (
          <View style={[styles.searchDropdown, { top: navBarHeight + 4 }]}>
            <FlatList
              data={searchResults.items.slice(0, 6)}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.searchRow,
                    pressedSearchItemId === item.id && styles.searchRowPressed,
                  ]}
                  onPressIn={() => setPressedSearchItemId(item.id)}
                  onPressOut={() => setPressedSearchItemId(null)}
                  onPress={() => {
                    setPressedSearchItemId(null);
                    handleAddProduct(item);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchRowName}>{item.name}</Text>
                    {item.category && (
                      <Text style={styles.searchRowCat}>{item.category}</Text>
                    )}
                  </View>
                  <Text style={styles.searchRowAdd}>＋</Text>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.searchSep} />}
            />
          </View>
        )}

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
          <Text style={styles.fabBadgeText}>{items.length.toString()}</Text>
        </View>
      </Pressable>

      <AuthGateSheet
        visible={showAuthGate}
        onDismiss={() => setShowAuthGate(false)}
        onContinueWithoutSaving={() => {
          setShowAuthGate(false);
          useGroceryListStore.getState().setEphemeral(true);
          router.push("/(app)/list");
        }}
      />
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
  const { width, height } = useWindowDimensions();
  const { activeSupermarketId } = useNavigationStore();
  const { data: layouts } = useLayouts(activeSupermarketId);
  const firstLayoutId = layouts?.[0]?.id ?? null;
  const { data: bundle } = useLayoutBundle(firstLayoutId);
  if (!bundle)
    return <View style={{ flex: 1, backgroundColor: colors.bgLight }} />;
  return (
    <SkiaMapCanvas
      bundle={bundle}
      route={null}
      mode="2d"
      userPos={null}
      canvasWidth={width}
      canvasHeight={height - 120}
    />
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
    borderBottomColor: colors.border,
  },
  logoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 80,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  logoText: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.brandDark,
    lineHeight: 12,
  },
  storePicker: {
    flex: 1,
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  storePickerActive: {
    borderColor: colors.routeActive,
    backgroundColor: colors.white,
  },
  storePickerText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  storePickerArrow: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  searchWrap: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { fontSize: 14, color: colors.textPrimary, flex: 1, padding: 0 },
  searchDropdown: {
    position: "absolute",
    left: spacing.gutter,
    right: spacing.gutter,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 30,
    maxHeight: 280,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchRowPressed: { backgroundColor: "rgba(15, 23, 42, 0.06)" },
  searchRowName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  searchRowCat: { fontSize: 12, color: colors.textSecondary },
  searchRowAdd: { fontSize: 18, color: colors.routeActive, fontWeight: "700" },
  searchSep: {
    height: 1,
    backgroundColor: colors.bgLight,
    marginHorizontal: 12,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIcon: { fontSize: 48, opacity: 0.3 },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  fab: {
    position: "absolute",
    bottom: spacing.safeAreaBottom + 16,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.brandDark,
    alignItems: "center",
    justifyContent: "center",
  },
  fabDisabled: { opacity: 0.5 },
  fabIcon: { fontSize: 22 },
  fabBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#06b6d4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.white,
  },
  fabBadgeText: { fontSize: 9, fontWeight: "900", color: colors.white },
});
