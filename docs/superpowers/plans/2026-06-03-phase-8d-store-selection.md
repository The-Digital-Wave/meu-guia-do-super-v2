# Phase 8d — Store Selection + Map Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the store-selection overlay (Screen 7), the map-loading state (Screen 8), and the redesigned empty-state home canvas (Screen 6). Wire `GET /supermarkets` to the UI and resolve the active supermarket's layout bundle into `useNavigationStore`.

**Architecture:** `/(app)/index.tsx` renders two states (no store / store loaded) driven by `activeSupermarketId` in `useNavigationStore`. Store selection is a Expo Router modal. Loading state is a full-screen route that fetches the bundle and then redirects back to index.

**Tech Stack:** Expo Router, React Native, NativeWind, TanStack Query, Zustand, `tokens.ts`

**Branch:** `feature/phase-8d-store-selection` (cut after 8a and 8c merge to master)

**Prerequisites:** Phase 8a merged (supermarkets API), Phase 8c merged (boot router, tokens.ts available).

---

## File Map

| Action | Path |
|--------|------|
| Modify | `client/src/types/index.ts` |
| Create | `client/src/hooks/useSupermarkets.ts` |
| Modify | `client/src/services/api.ts` |
| Modify | `client/src/stores/useNavigationStore.ts` |
| Rewrite | `client/app/(app)/index.tsx` |
| Create | `client/app/(app)/store-select.tsx` |
| Create | `client/app/(app)/store-loading.tsx` |
| Modify | `client/src/mocks/handlers.ts` |

---

## Task 1: Add `Supermarket` type and update `api.ts`

**Files:**
- Modify: `client/src/types/index.ts`
- Modify: `client/src/services/api.ts`

- [ ] **Step 1: Add Supermarket type**

In `client/src/types/index.ts`, append:

```typescript
export interface Supermarket {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
}

export interface SupermarketDetail extends Supermarket {
  layouts: Layout[];
}
```

- [ ] **Step 2: Add `getSupermarkets` to `api.ts`**

In `client/src/services/api.ts`, add after the existing exports:

```typescript
export async function getSupermarkets(): Promise<Supermarket[]> {
  const { data } = await api.get<Supermarket[]>("/supermarkets");
  return data;
}
```

Also update the layout list call to support the `supermarket_id` query param:

```typescript
export async function getLayoutsByStore(supermarketId: string): Promise<Layout[]> {
  const { data } = await api.get<Layout[]>("/layouts", {
    params: { supermarket_id: supermarketId },
  });
  return data;
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add client/src/types/index.ts client/src/services/api.ts
git commit -m "feat(types): add Supermarket type and getSupermarkets/getLayoutsByStore API calls"
```

---

## Task 2: Create `useSupermarkets` hook

**Files:**
- Create: `client/src/hooks/useSupermarkets.ts`

- [ ] **Step 1: Create the hook**

```typescript
// client/src/hooks/useSupermarkets.ts
import { useQuery } from "@tanstack/react-query";
import { getSupermarkets } from "@/services/api";
import type { Supermarket } from "@/types";

export function useSupermarkets() {
  return useQuery<Supermarket[]>({
    queryKey: ["supermarkets"],
    queryFn: getSupermarkets,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/useSupermarkets.ts
git commit -m "feat(hooks): add useSupermarkets hook"
```

---

## Task 3: Update `useNavigationStore` with supermarket state

**Files:**
- Modify: `client/src/stores/useNavigationStore.ts`

- [ ] **Step 1: Add supermarket fields to the store**

In `client/src/stores/useNavigationStore.ts`, add to the interface:

```typescript
interface NavigationState {
  // ... existing fields ...
  activeSupermarketId: string | null;
  activeSupermarketName: string | null;
  setActiveSupermarket: (id: string, name: string) => void;
  clearSupermarket: () => void;
}
```

Add to the `create` call initial state:

```typescript
activeSupermarketId: null,
activeSupermarketName: null,

setActiveSupermarket: (id, name) =>
  set({ activeSupermarketId: id, activeSupermarketName: name }),

clearSupermarket: () =>
  set({ activeSupermarketId: null, activeSupermarketName: null }),
```

Also update `clearNavigation` to also clear supermarket:

```typescript
clearNavigation: () =>
  set({
    userNodeId:           null,
    activeRoute:          null,
    phase:                "idle",
    activeStepIndex:      0,
    isNavigating:         false,
    activeSupermarketId:  null,
    activeSupermarketName:null,
  }),
```

- [ ] **Step 2: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add client/src/stores/useNavigationStore.ts
git commit -m "feat(nav-store): add activeSupermarket fields and setActiveSupermarket action"
```

---

## Task 4: Add MSW handler for supermarkets

**Files:**
- Modify: `client/src/mocks/handlers.ts`

- [ ] **Step 1: Add MOCK_SUPERMARKETS and the handler**

In `client/src/mocks/handlers.ts`, add the mock data constant:

```typescript
const MOCK_SUPERMARKETS = [
  {
    id: "super-001",
    name: "Supermercado A",
    slug: "supermercado-a",
    logo_url: null,
    is_active: true,
  },
  {
    id: "super-002",
    name: "Supermercado B",
    slug: "supermercado-b",
    logo_url: null,
    is_active: true,
  },
  {
    id: "super-003",
    name: "Supermercado C",
    slug: "supermercado-c",
    logo_url: null,
    is_active: true,
  },
];
```

Then add to the `handlers` array:

```typescript
http.get(`${BASE}/supermarkets`, () => {
  return HttpResponse.json(MOCK_SUPERMARKETS);
}),

http.get(`${BASE}/supermarkets/:id`, ({ params }) => {
  const sm = MOCK_SUPERMARKETS.find((s) => s.id === params.id);
  if (!sm) return new HttpResponse(null, { status: 404 });
  return HttpResponse.json({ ...sm, layouts: [MOCK_LAYOUT] });
}),
```

Also update the existing `GET /layouts` handler to support the `supermarket_id` query param:

```typescript
http.get(`${BASE}/layouts`, ({ request }) => {
  const url = new URL(request.url);
  const supermarketId = url.searchParams.get("supermarket_id");
  // If filtering, return only layouts for that supermarket
  if (supermarketId && supermarketId !== "super-001") {
    return HttpResponse.json([]);
  }
  return HttpResponse.json([MOCK_LAYOUT]);
}),
```

- [ ] **Step 2: Commit**

```bash
git add client/src/mocks/handlers.ts
git commit -m "feat(msw): add supermarkets handlers and supermarket_id filter to layouts"
```

---

## Task 5: Create store-select screen (modal)

**Files:**
- Create: `client/app/(app)/store-select.tsx`

- [ ] **Step 1: Write the screen**

```typescript
// client/app/(app)/store-select.tsx
import { View, Text, Pressable, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useSupermarkets } from "@/hooks/useSupermarkets";
import type { Supermarket } from "@/types";
import { colors, spacing, typography } from "@/theme/tokens";

export default function StoreSelectScreen() {
  const { data: supermarkets, isLoading, isError } = useSupermarkets();

  function handleSelect(sm: Supermarket) {
    // Only Supermercado A has a layout; others are disabled
    if (sm.slug !== "supermercado-a") return;
    router.replace({
      pathname: "/(app)/store-loading",
      params: { supermarketId: sm.id, supermarketName: sm.name },
    });
  }

  return (
    <View style={styles.container}>
      {/* Handle bar */}
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
              >
                {/* Logo initial */}
                <View style={[styles.logoCircle, { backgroundColor: index === 0 ? "#2563EB" : index === 1 ? "#15803d" : "#ca8a04" }]}>
                  <Text style={styles.logoInitial}>{item.name.charAt(item.name.length - 1)}</Text>
                </View>
                <Text style={[styles.rowName, !hasLayout && styles.rowNameDisabled]}>{item.name}</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: 12,
    paddingHorizontal: spacing.gutter,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 48, height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: { ...typography.h2, color: colors.brandDark, marginBottom: 16 },
  separator: { height: 1, backgroundColor: colors.border },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  rowDisabled: { opacity: 0.55 },
  logoCircle: {
    width: 28, height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoInitial: { color: colors.white, fontSize: 11, fontWeight: "700" },
  rowName: { ...typography.body, fontWeight: "600", color: colors.textPrimary, flex: 1 },
  rowNameDisabled: { color: colors.textSecondary },
  selectArrow: { ...typography.meta, color: colors.routeActive, fontWeight: "700" },
  errorText: { ...typography.body, color: "#ef4444", textAlign: "center", marginTop: 16 },
});
```

- [ ] **Step 2: Commit**

```bash
git add client/app/(app)/store-select.tsx
git commit -m "feat(store-select): add supermarket selection modal screen"
```

---

## Task 6: Create store-loading screen

**Files:**
- Create: `client/app/(app)/store-loading.tsx`

- [ ] **Step 1: Write the screen**

```typescript
// client/app/(app)/store-loading.tsx
import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useLayoutBundle } from "@/hooks/useLayouts";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { colors, spacing, typography } from "@/theme/tokens";

export default function StoreLoadingScreen() {
  const { supermarketId, supermarketName } = useLocalSearchParams<{
    supermarketId: string;
    supermarketName: string;
  }>();

  const { setActiveSupermarket } = useNavigationStore();

  // Fetch layout ID for this supermarket, then fetch the full bundle
  // For now we use the first layout — Phase 8d doesn't expose a layout picker
  const { data: bundle, isSuccess, isError } = useLayoutBundle(
    // We hardcode the demo layout ID from MSW / seed; in production, this comes
    // from GET /layouts?supermarket_id=<id> then picking [0].id
    supermarketId === "super-001" ? "layout-001" : null
  );

  useEffect(() => {
    if (isSuccess && bundle) {
      setActiveSupermarket(supermarketId, supermarketName ?? "");
      router.replace("/(app)/");
    }
  }, [isSuccess, bundle]);

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.loadingBadge}
        onPress={() => {/* no-op, just animated badge */}}
      >
        <Text style={styles.loadingText}>Carregando...</Text>
      </Pressable>
      <Text style={styles.subText}>Aguarde o carregamento do layout</Text>

      {isError && (
        <View style={styles.errorBlock}>
          <Text style={styles.errorText}>Erro ao carregar o mapa.</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandDark,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingBadge: {
    backgroundColor: colors.loadingYellow,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b45309",
  },
  loadingText: {
    color: colors.brandDark,
    fontWeight: "700",
    fontSize: 12,
    fontFamily: "Courier New",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  subText: { ...typography.meta, color: "rgba(255,255,255,0.45)", fontFamily: "Courier New" },
  errorBlock: { alignItems: "center", gap: 8, marginTop: 16 },
  errorText: { ...typography.body, color: "#ef4444" },
  retryText: { ...typography.body, color: colors.brandVibrant, fontWeight: "700" },
});
```

- [ ] **Step 2: Commit**

```bash
git add client/app/(app)/store-loading.tsx
git commit -m "feat(store-loading): add asset parsing loading screen"
```

---

## Task 7: Rewrite `/(app)/index.tsx` with two states

**Files:**
- Rewrite: `client/app/(app)/index.tsx`

- [ ] **Step 1: Rewrite the home screen**

```typescript
// client/app/(app)/index.tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { colors, spacing, typography } from "@/theme/tokens";

export default function HomeScreen() {
  const { activeSupermarketId, activeSupermarketName } = useNavigationStore();

  const hasStore = !!activeSupermarketId;

  return (
    <View style={styles.container}>
      {/* Top nav */}
      <View style={styles.navBar}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoBg}>
            <Text style={{ fontSize: 14 }}>🛒</Text>
          </View>
          <Text style={styles.logoText}>Meu Guia{"\n"}do Super</Text>
        </View>

        {/* Store picker button */}
        <Pressable
          style={[styles.storePicker, hasStore && styles.storePickerActive]}
          onPress={() => router.push("/(app)/store-select")}
        >
          <Text style={styles.storePickerText} numberOfLines={1}>
            {hasStore ? activeSupermarketName : "Selecione um supermercado"}
          </Text>
          <Text style={styles.storePickerArrow}>{hasStore ? "↑" : "↓"}</Text>
        </Pressable>

        {/* Avatar */}
        <Pressable
          style={styles.avatar}
          onPress={() => router.push("/(app)/settings")}
        >
          <Text style={styles.avatarText}>EU</Text>
        </Pressable>
      </View>

      {/* Body */}
      {!hasStore ? (
        <EmptyState />
      ) : (
        <LoadedState />
      )}

      {/* Cart FAB */}
      <Pressable
        style={[styles.fab, !hasStore && styles.fabDisabled]}
        disabled={!hasStore}
        onPress={() => router.push("/(app)/list")}
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
      {/* Placeholder for Skia map canvas — Phase 8f will replace this */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>Mapa será renderizado aqui (Phase 8f)</Text>
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
  logoBg: {
    width: 24, height: 24,
    backgroundColor: colors.brandDark,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 9, fontWeight: "900", color: colors.brandDark, lineHeight: 12 },
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
  storePickerActive: { borderColor: colors.routeActive, backgroundColor: colors.white },
  storePickerText: { ...typography.meta, fontWeight: "600", color: colors.textPrimary, flex: 1 },
  storePickerArrow: { ...typography.meta, color: colors.textSecondary, marginLeft: 4 },
  avatar: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 8, fontWeight: "700", color: colors.textSecondary },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIcon: { fontSize: 48, opacity: 0.3 },
  emptyText: { ...typography.body, color: colors.textSecondary },

  loadedContainer: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  mapPlaceholderText: { ...typography.meta, color: colors.textMeta },

  fab: {
    position: "absolute",
    bottom: spacing.safeAreaBottom + 16,
    right: 16,
    width: 52, height: 52,
    borderRadius: 16,
    backgroundColor: colors.brandDark,
    alignItems: "center",
    justifyContent: "center",
  },
  fabDisabled: { opacity: 0.5 },
  fabIcon: { fontSize: 22 },
  fabBadge: {
    position: "absolute",
    top: -4, right: -4,
    width: 18, height: 18,
    borderRadius: 9,
    backgroundColor: "#06b6d4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.white,
  },
  fabBadgeText: { fontSize: 9, fontWeight: "900", color: colors.white },
});
```

Note: the `colors.textMeta` reference — ensure it's exported from `tokens.ts` (it was defined there as `'rgba(0,0,0,0.40)'`).

- [ ] **Step 2: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add client/app/(app)/index.tsx
git commit -m "feat(home): rewrite home screen with two-state store selection flow"
```

---

## Task 8: Register store-select as a modal route

**Files:**
- Modify: `client/app/(app)/_layout.tsx`

- [ ] **Step 1: Check and update the (app) layout**

Open `client/app/(app)/_layout.tsx`. Add `store-select` as a modal presentation:

```typescript
import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="store-select" options={{ presentation: "modal" }} />
      <Stack.Screen name="store-loading" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="list" />
      <Stack.Screen name="map" />
      <Stack.Screen name="navigation" />
    </Stack>
  );
}
```

- [ ] **Step 2: TypeScript check + ESLint**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add client/app/(app)/_layout.tsx
git commit -m "feat(routing): register store-select as modal and declare all (app) screens"
```

---

## Task 9: Run CI and push

- [ ] **Step 1: Full frontend checks**

```bash
cd client && npx tsc --noEmit && npx eslint app/ src/ --max-warnings 0
```

Expected: no errors.

- [ ] **Step 2: Push and open PR**

```bash
git push origin feature/phase-8d-store-selection
```

Open PR from `feature/phase-8d-store-selection` → `master`.
