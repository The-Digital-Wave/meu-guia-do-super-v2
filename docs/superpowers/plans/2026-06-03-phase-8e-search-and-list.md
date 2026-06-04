# Phase 8e — Search + Pre-flight List Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add in-place product search with results dropdown to the home screen, implement the pre-flight picking queue modal (`list.tsx`), add the guest auth-gate bottom sheet, and wire the "Iniciar navegação" CTA to route to the map screen.

**Architecture:** Search is embedded in the nav bar of `index.tsx` (no route push). The cart FAB opens `list.tsx` as an Expo Router modal. Guest auth-gating is an inline `AuthGateSheet` component. `useGroceryListStore` gains `isEphemeral` and `addItem`/`removeItem` actions.

**Tech Stack:** Expo Router, React Native, TanStack Query, Zustand, `react-native-reorderable-list`, `tokens.ts`

**Branch:** `feature/phase-8e-search-and-list` (cut after 8d merges)

**Prerequisite:** Phase 8d merged.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `client/src/stores/useGroceryListStore.ts` |
| Create | `client/src/components/AuthGateSheet.tsx` |
| Modify | `client/app/(app)/index.tsx` |
| Rewrite | `client/app/(app)/list.tsx` |
| Modify | `client/src/mocks/handlers.ts` |

---

## Task 1: Update `useGroceryListStore`

**Files:**
- Modify: `client/src/stores/useGroceryListStore.ts`

- [ ] **Step 1: Add `isEphemeral`, `addItem`, `removeItem`, `reorderItems`**

Replace the entire `useGroceryListStore.ts` content:

```typescript
import { create } from "zustand";
import type { Product } from "@/types";

export interface CartItem {
  id: string;           // product.id used as cart item id
  product_id: string;
  product_name_snapshot: string;
  category: string | null;
  sort_order: number;
  checked: boolean;
}

interface GroceryListState {
  items: CartItem[];
  isEphemeral: boolean;

  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  reorderItems: (newItems: CartItem[]) => void;
  setEphemeral: (value: boolean) => void;
  clearList: () => void;
}

export const useGroceryListStore = create<GroceryListState>((set, get) => ({
  items: [],
  isEphemeral: false,

  addItem: (product) => {
    const { items } = get();
    // Prevent duplicates
    if (items.find((i) => i.product_id === product.id)) return;
    const newItem: CartItem = {
      id: product.id,
      product_id: product.id,
      product_name_snapshot: product.name,
      category: product.category ?? null,
      sort_order: items.length,
      checked: false,
    };
    set({ items: [...items, newItem] });
  },

  removeItem: (productId) =>
    set((state) => ({
      items: state.items
        .filter((i) => i.product_id !== productId)
        .map((item, index) => ({ ...item, sort_order: index })),
    })),

  toggleItem: (productId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.product_id === productId ? { ...item, checked: !item.checked } : item
      ),
    })),

  reorderItems: (newItems) => set({ items: newItems }),

  setEphemeral: (value) => set({ isEphemeral: value }),

  clearList: () => set({ items: [], isEphemeral: false }),
}));
```

- [ ] **Step 2: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add client/src/stores/useGroceryListStore.ts
git commit -m "feat(grocery-store): add addItem, removeItem, reorderItems, isEphemeral"
```

---

## Task 2: Create `AuthGateSheet` component

**Files:**
- Create: `client/src/components/AuthGateSheet.tsx`

- [ ] **Step 1: Create the component**

```typescript
// client/src/components/AuthGateSheet.tsx
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { router } from "expo-router";
import { colors, spacing, typography } from "@/theme/tokens";

interface AuthGateSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onContinueWithoutSaving?: () => void;
}

export default function AuthGateSheet({
  visible,
  onDismiss,
  onContinueWithoutSaving,
}: AuthGateSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Crie uma conta para salvar sua lista</Text>
        <Text style={styles.body}>
          Com uma conta, suas listas de compras ficam salvas e disponíveis em qualquer dispositivo.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          onPress={() => { onDismiss(); router.push("/(auth)/register"); }}
        >
          <Text style={styles.ctaText}>CRIAR CONTA</Text>
        </Pressable>

        <Pressable
          style={styles.loginBtn}
          onPress={() => { onDismiss(); router.push("/(auth)/login"); }}
        >
          <Text style={styles.loginBtnText}>Entrar</Text>
        </Pressable>

        {onContinueWithoutSaving && (
          <Pressable style={styles.skipBtn} onPress={onContinueWithoutSaving}>
            <Text style={styles.skipBtnText}>Continuar sem salvar</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.gutter + 4,
    paddingBottom: spacing.safeAreaBottom + 16,
    gap: 16,
  },
  handle: {
    width: 48, height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  title: { ...typography.h2, color: colors.brandDark },
  body: { ...typography.body, color: colors.textSecondary, lineHeight: 20 },
  cta: {
    backgroundColor: colors.brandVibrant,
    borderRadius: spacing.pillRadius,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: { ...typography.badge, fontSize: 13, color: colors.brandDark, letterSpacing: 2 },
  loginBtn: { alignItems: "center", paddingVertical: 8 },
  loginBtnText: { ...typography.body, fontWeight: "600", color: colors.routeActive },
  skipBtn: { alignItems: "center", paddingVertical: 4 },
  skipBtnText: { ...typography.meta, color: colors.textSecondary, textDecorationLine: "underline" },
});
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/AuthGateSheet.tsx
git commit -m "feat(auth-gate): add AuthGateSheet bottom sheet component"
```

---

## Task 3: Add search to `index.tsx`

**Files:**
- Modify: `client/app/(app)/index.tsx`

- [ ] **Step 1: Add search state and search results overlay**

Add these imports to `index.tsx`:

```typescript
import { useState, useCallback } from "react";
import { FlatList, TextInput, Animated } from "react-native";
import { useProductSearch } from "@/hooks/useProducts";
import { useGroceryListStore } from "@/stores/useGroceryListStore";
import { useAuthStore } from "@/stores/useAuthStore";
import AuthGateSheet from "@/components/AuthGateSheet";
import type { Product } from "@/types";
```

Add this state inside `HomeScreen`:

```typescript
const [query, setQuery] = useState("");
const [showAuthGate, setShowAuthGate] = useState(false);
const { data: searchResults } = useProductSearch(query);
const { addItem, items } = useGroceryListStore();
const { isGuest } = useAuthStore();

const handleAddProduct = useCallback((product: Product) => {
  addItem(product);
  setQuery("");  // collapse search
}, [addItem]);

const handleFabPress = useCallback(() => {
  if (isGuest) {
    setShowAuthGate(true);
  } else {
    router.push("/(app)/list");
  }
}, [isGuest]);
```

Update the nav bar section to include the search input (place between store picker and avatar):

```typescript
{hasStore && (
  <View style={styles.searchWrap}>
    <TextInput
      style={styles.searchInput}
      value={query}
      onChangeText={setQuery}
      placeholder="Buscar produto..."
      placeholderTextColor={colors.textSecondary}
      returnKeyType="search"
    />
  </View>
)}
```

Add the search results dropdown (absolute-positioned, below nav bar):

```typescript
{hasStore && query.length > 0 && searchResults && searchResults.items.length > 0 && (
  <View style={styles.searchDropdown}>
    <FlatList
      data={searchResults.items.slice(0, 6)}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <Pressable
          style={styles.searchRow}
          onPress={() => handleAddProduct(item)}
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
```

Update the FAB `onPress` to call `handleFabPress` and update badge count:

```typescript
onPress={handleFabPress}
// badge text: items.length
```

Add the `AuthGateSheet` at the bottom of the JSX (before the closing tag):

```typescript
<AuthGateSheet
  visible={showAuthGate}
  onDismiss={() => setShowAuthGate(false)}
  onContinueWithoutSaving={() => {
    setShowAuthGate(false);
    useGroceryListStore.getState().setEphemeral(true);
    router.push("/(app)/list");
  }}
/>
```

Add new styles:

```typescript
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
searchInput: {
  ...typography.body,
  color: colors.textPrimary,
  flex: 1,
  padding: 0,
},
searchDropdown: {
  position: "absolute",
  top: spacing.navBarHeight + spacing.safeAreaTop,
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
searchRowName: { ...typography.body, fontWeight: "600", color: colors.textPrimary },
searchRowCat: { ...typography.meta, color: colors.textSecondary },
searchRowAdd: { fontSize: 18, color: colors.routeActive, fontWeight: "700" },
searchSep: { height: 1, backgroundColor: colors.bgLight, marginHorizontal: 12 },
```

- [ ] **Step 2: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add client/app/(app)/index.tsx
git commit -m "feat(search): add in-place product search with dropdown and cart FAB counter"
```

---

## Task 4: Rewrite `list.tsx` — Pre-flight Queue Modal

**Files:**
- Rewrite: `client/app/(app)/list.tsx`

- [ ] **Step 1: Rewrite the file**

```typescript
// client/app/(app)/list.tsx
import { useCallback } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import ReorderableList, { ReorderableListReorderEvent } from "react-native-reorderable-list";
import { useGroceryListStore, type CartItem } from "@/stores/useGroceryListStore";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { api } from "@/services/api";
import { colors, spacing, typography } from "@/theme/tokens";
import { useState } from "react";

export default function ListModal() {
  const { items, removeItem, reorderItems, clearList } = useGroceryListStore();
  const { activeSupermarketId } = useNavigationStore();
  const [loading, setLoading] = useState(false);

  const handleReorder = useCallback(
    (event: ReorderableListReorderEvent) => {
      const reordered = [...items];
      const [moved] = reordered.splice(event.fromIndex, 1);
      reordered.splice(event.toIndex, 0, moved);
      reorderItems(reordered.map((item, i) => ({ ...item, sort_order: i })));
    },
    [items, reorderItems]
  );

  async function handleStartNavigation() {
    if (items.length === 0) return;
    setLoading(true);
    try {
      // Use existing navigation route endpoint
      // The layout ID comes from the first layout associated with the active supermarket
      // For Phase 8e we derive it from the bundle stored in navigation store
      const { activeRoute } = useNavigationStore.getState();
      // If already have a route, go directly to map
      if (activeRoute) {
        router.replace("/(app)/map");
        return;
      }
      // Otherwise request a new route — placeholder; full wiring happens in Phase 8f
      router.replace("/(app)/map");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível calcular a rota. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Handle */}
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Lista de Compras</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{items.length} {items.length === 1 ? "Item" : "Itens"}</Text>
        </View>
      </View>

      {/* Item list */}
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sua lista está vazia.</Text>
          <Text style={styles.emptySubText}>Pesquise produtos e adicione-os à lista.</Text>
        </View>
      ) : (
        <ReorderableList
          data={items}
          keyExtractor={(item) => item.id}
          onReorder={handleReorder}
          renderItem={({ item }: { item: CartItem }) => (
            <View style={styles.row}>
              <Text style={styles.rowEmoji}>🛍</Text>
              <Text style={styles.rowName} numberOfLines={1}>{item.product_name_snapshot}</Text>
              <Pressable onPress={() => removeItem(item.product_id)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </Pressable>
            </View>
          )}
          style={styles.list}
        />
      )}

      {/* CTA */}
      <Pressable
        style={({ pressed }) => [
          styles.cta,
          items.length === 0 && styles.ctaDisabled,
          pressed && items.length > 0 && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
        onPress={handleStartNavigation}
        disabled={items.length === 0 || loading}
      >
        {loading
          ? <ActivityIndicator color={colors.brandDark} />
          : <Text style={styles.ctaText}>Iniciar navegação →</Text>
        }
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.safeAreaBottom + 16,
  },
  handle: {
    width: 48, height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.brandDark, fontFamily: "Georgia" },
  countBadge: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  countText: { ...typography.badge, color: "#059669" },
  list: { flex: 1, marginBottom: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  rowEmoji: { fontSize: 18 },
  rowName: { ...typography.body, fontWeight: "600", color: colors.textPrimary, flex: 1 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 14, color: "#ef4444", fontWeight: "600" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 48 },
  emptyText: { ...typography.body, fontWeight: "600", color: colors.textSecondary },
  emptySubText: { ...typography.meta, color: colors.textSecondary, textAlign: "center" },
  cta: {
    backgroundColor: "#15803d",
    borderRadius: spacing.pillRadius,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ctaDisabled: { opacity: 0.35 },
  ctaText: { ...typography.body, fontWeight: "700", color: colors.white, letterSpacing: 0.5 },
});
```

- [ ] **Step 2: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add client/app/(app)/list.tsx
git commit -m "feat(list): rewrite pre-flight picking queue modal with reorderable list"
```

---

## Task 5: Update MSW handlers with product search support

**Files:**
- Modify: `client/src/mocks/handlers.ts`

- [ ] **Step 1: Update GET /products handler for search**

Find the existing `GET /products` handler and update it to filter by `q`:

```typescript
http.get(`${BASE}/products`, ({ request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";
  const filtered = q
    ? MOCK_PRODUCTS.filter((p) => p.name.toLowerCase().includes(q))
    : MOCK_PRODUCTS;
  return HttpResponse.json({
    items: filtered,
    total: filtered.length,
    page: 1,
    size: 20,
  });
}),
```

Also update `MOCK_PRODUCTS` to use Brazilian grocery names (matching Phase 8a seed update):

```typescript
const MOCK_PRODUCTS = [
  { id: "prod-001", name: "Leite Integral 1L",      category: "Laticínios",  shelf_id: "shelf-001", sku: "LEIT001", image_url: null, brand: null, description: null, quantity: 1, section_index: null },
  { id: "prod-002", name: "Queijo Mussarela 500g",   category: "Laticínios",  shelf_id: "shelf-001", sku: "QUEJ001", image_url: null, brand: null, description: null, quantity: 1, section_index: null },
  { id: "prod-003", name: "Iogurte Natural 170g",    category: "Laticínios",  shelf_id: "shelf-001", sku: "IOGR001", image_url: null, brand: null, description: null, quantity: 1, section_index: null },
  { id: "prod-004", name: "Pão de Forma Integral",   category: "Padaria",     shelf_id: "shelf-002", sku: "PAOF001", image_url: null, brand: null, description: null, quantity: 1, section_index: null },
  { id: "prod-005", name: "Frango Inteiro 1kg",      category: "Carnes",      shelf_id: "shelf-002", sku: "FRAN001", image_url: null, brand: null, description: null, quantity: 1, section_index: null },
  { id: "prod-006", name: "Arroz Branco 5kg",        category: "Mercearia",   shelf_id: "shelf-002", sku: "ARRZ001", image_url: null, brand: null, description: null, quantity: 1, section_index: null },
  { id: "prod-007", name: "Feijão Carioca 1kg",      category: "Mercearia",   shelf_id: "shelf-002", sku: "FEIJ001", image_url: null, brand: null, description: null, quantity: 1, section_index: null },
  { id: "prod-008", name: "Detergente Líquido 500ml",category: "Limpeza",     shelf_id: "shelf-002", sku: "DETE001", image_url: null, brand: null, description: null, quantity: 1, section_index: null },
];
```

- [ ] **Step 2: Commit**

```bash
git add client/src/mocks/handlers.ts
git commit -m "feat(msw): update products to Brazilian grocery names, add q filter support"
```

---

## Task 6: CI checks and push

- [ ] **Step 1: TypeScript + ESLint**

```bash
cd client && npx tsc --noEmit && npx eslint app/ src/ --max-warnings 0
```

- [ ] **Step 2: Push and open PR**

```bash
git push origin feature/phase-8e-search-and-list
```

Open PR from `feature/phase-8e-search-and-list` → `master`.
