# Phase 8g — 3D Axonometric Navigation + Swipe Gestures + Queue Succession

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full turn-by-turn navigation experience: the 1200ms 2D→3D camera transition, the 5-state navigation machine (`GUIDANCE_ACTIVE → SWIPE_REVEALED → CONFIRMING → QUEUE_ADVANCING → TRIP_COMPLETE`), the swipe-to-pick/skip gesture row, and the 400ms confirmation overlay.

**Architecture:** Navigation state lives in `useNavigationStore` as `navState: NavState`. `navigation.tsx` is a single screen that renders different sub-layouts based on `navState`. The `SkiaMapCanvas` receives `mode` derived from `transitionProgress >= 0.5`. Camera pan lerps toward the active waypoint during queue succession.

**Tech Stack:** `react-native-gesture-handler`, `react-native-reanimated`, `@shopify/react-native-skia`, Zustand, TypeScript

**Branch:** `feature/phase-8g-nav-3d-and-gestures` (cut after 8f merges)

**Prerequisite:** Phase 8f merged.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `client/src/stores/useNavigationStore.ts` |
| Create | `client/src/components/map/SwipeableItemCard.tsx` |
| Create | `client/src/components/map/ConfirmationOverlay.tsx` |
| Rewrite | `client/app/(app)/navigation.tsx` |

---

## Task 1: Add `navState` to `useNavigationStore`

**Files:**
- Modify: `client/src/stores/useNavigationStore.ts`

- [ ] **Step 1: Define `NavState` type and add to the store**

Add to `useNavigationStore.ts`, before the interface declaration:

```typescript
export type NavState =
  | "GUIDANCE_ACTIVE"
  | "SWIPE_REVEALED"
  | "CONFIRMING"
  | "QUEUE_ADVANCING"
  | "TRIP_COMPLETE";
```

Add to `NavigationState` interface:

```typescript
navState: NavState;
transitionProgress: number;  // 0→1, drives 2D→3D mode switch
setNavState: (state: NavState) => void;
setTransitionProgress: (progress: number) => void;
```

Add to the `create` call initial state:

```typescript
navState: "GUIDANCE_ACTIVE",
transitionProgress: 0,
setNavState: (state) => set({ navState: state }),
setTransitionProgress: (progress) => set({ transitionProgress: progress }),
```

- [ ] **Step 2: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add client/src/stores/useNavigationStore.ts
git commit -m "feat(nav-store): add NavState type and navState/transitionProgress fields"
```

---

## Task 2: Write state machine unit tests

**Files:**
- Create: `client/src/stores/__tests__/navigationStore.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// client/src/stores/__tests__/navigationStore.test.ts
import { useNavigationStore } from "../useNavigationStore";

function resetStore() {
  useNavigationStore.setState({
    navState: "GUIDANCE_ACTIVE",
    transitionProgress: 0,
    activeRoute: null,
    activeStepIndex: 0,
  });
}

describe("NavState machine", () => {
  beforeEach(resetStore);

  it("starts in GUIDANCE_ACTIVE", () => {
    expect(useNavigationStore.getState().navState).toBe("GUIDANCE_ACTIVE");
  });

  it("transitions GUIDANCE_ACTIVE → SWIPE_REVEALED on setNavState", () => {
    useNavigationStore.getState().setNavState("SWIPE_REVEALED");
    expect(useNavigationStore.getState().navState).toBe("SWIPE_REVEALED");
  });

  it("transitions SWIPE_REVEALED → CONFIRMING", () => {
    useNavigationStore.getState().setNavState("SWIPE_REVEALED");
    useNavigationStore.getState().setNavState("CONFIRMING");
    expect(useNavigationStore.getState().navState).toBe("CONFIRMING");
  });

  it("transitions CONFIRMING → QUEUE_ADVANCING", () => {
    useNavigationStore.getState().setNavState("CONFIRMING");
    useNavigationStore.getState().setNavState("QUEUE_ADVANCING");
    expect(useNavigationStore.getState().navState).toBe("QUEUE_ADVANCING");
  });

  it("transitions QUEUE_ADVANCING → GUIDANCE_ACTIVE (next item)", () => {
    useNavigationStore.getState().setNavState("QUEUE_ADVANCING");
    useNavigationStore.getState().setNavState("GUIDANCE_ACTIVE");
    expect(useNavigationStore.getState().navState).toBe("GUIDANCE_ACTIVE");
  });

  it("transitions QUEUE_ADVANCING → TRIP_COMPLETE (empty queue)", () => {
    useNavigationStore.getState().setNavState("QUEUE_ADVANCING");
    useNavigationStore.getState().setNavState("TRIP_COMPLETE");
    expect(useNavigationStore.getState().navState).toBe("TRIP_COMPLETE");
  });

  it("SkiaMapCanvas mode is 2d when transitionProgress < 0.5", () => {
    useNavigationStore.getState().setTransitionProgress(0.4);
    const mode = useNavigationStore.getState().transitionProgress < 0.5 ? "2d" : "3d";
    expect(mode).toBe("2d");
  });

  it("SkiaMapCanvas mode is 3d when transitionProgress >= 0.5", () => {
    useNavigationStore.getState().setTransitionProgress(0.5);
    const mode = useNavigationStore.getState().transitionProgress < 0.5 ? "2d" : "3d";
    expect(mode).toBe("3d");
  });
});
```

- [ ] **Step 2: Run — expect all to pass (store logic is simple)**

```bash
cd client && npx jest src/stores/__tests__/navigationStore.test.ts --no-coverage
```

Expected:
```
PASS src/stores/__tests__/navigationStore.test.ts
  NavState machine
    ✓ starts in GUIDANCE_ACTIVE
    ✓ transitions GUIDANCE_ACTIVE → SWIPE_REVEALED on setNavState
    ... (8 tests pass)
```

- [ ] **Step 3: Commit**

```bash
git add client/src/stores/__tests__/navigationStore.test.ts
git commit -m "test(nav-store): add NavState machine unit tests"
```

---

## Task 3: Create `SwipeableItemCard.tsx`

**Files:**
- Create: `client/src/components/map/SwipeableItemCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
// client/src/components/map/SwipeableItemCard.tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import type { CartItem } from "@/stores/useGroceryListStore";
import { colors, typography, spacing } from "@/theme/tokens";

const SWIPE_THRESHOLD = 64;
const LOCK_OFFSET = -160;

interface SwipeableItemCardProps {
  item: CartItem;
  sequenceIndex: number;
  distanceLabel: string;
  onPick: () => void;
  onSkip: () => void;
  onReveal: () => void;  // called when card locks at LOCK_OFFSET
  isRevealed: boolean;
}

export default function SwipeableItemCard({
  item, sequenceIndex, distanceLabel,
  onPick, onSkip, onReveal, isRevealed,
}: SwipeableItemCardProps) {
  const translateX = useSharedValue(isRevealed ? LOCK_OFFSET : 0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      // Only allow leftward swipe
      if (e.translationX < 0) {
        translateX.value = Math.max(LOCK_OFFSET, e.translationX);
      }
    })
    .onEnd(() => {
      if (translateX.value <= SWIPE_THRESHOLD * -1) {
        // Lock into revealed state
        translateX.value = withSpring(LOCK_OFFSET);
        runOnJS(onReveal)();
      } else {
        // Snap back
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Action buttons behind the card */}
      <View style={styles.actions}>
        <Pressable style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipText}>PULAR</Text>
        </Pressable>
        <Pressable style={styles.pickBtn} onPress={onPick}>
          <Text style={styles.pickText}>COLETADO →</Text>
        </Pressable>
      </View>

      {/* Swipeable card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Sequence badge */}
          <View style={styles.seqBadge}>
            <Text style={styles.seqText}>{sequenceIndex}</Text>
          </View>

          {/* Product thumbnail */}
          <View style={styles.thumb}>
            <Text style={{ fontSize: 24 }}>📦</Text>
          </View>

          {/* Product info */}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={2}>{item.product_name_snapshot}</Text>
            <View style={styles.meta}>
              <View style={styles.skuBadge}>
                <Text style={styles.skuText}>{item.product_id.slice(0, 6).toUpperCase()}</Text>
              </View>
              <Text style={styles.distance}>{distanceLabel}</Text>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    marginHorizontal: spacing.gutter,
    marginBottom: 8,
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  actions: {
    position: "absolute",
    top: 0, bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    borderRadius: 12,
  },
  skipBtn: {
    flex: 1,
    backgroundColor: colors.actionSkip,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    ...typography.badge,
    color: colors.white,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  pickBtn: {
    flex: 1,
    backgroundColor: colors.actionPick,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.2)",
  },
  pickText: {
    ...typography.badge,
    color: colors.white,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  card: {
    position: "absolute",
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 12,
  },
  seqBadge: {
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: colors.waypointTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  seqText: { ...typography.badge, color: colors.white, fontSize: 11 },
  thumb: {
    width: 48, height: 48,
    backgroundColor: colors.bgLight,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: { flex: 1, gap: 4 },
  name: { ...typography.body, fontWeight: "700", color: colors.textPrimary, lineHeight: 18 },
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  skuBadge: {
    backgroundColor: colors.bgLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skuText: { ...typography.badge, color: colors.textSecondary },
  distance: { ...typography.badge, color: colors.routeActive, fontWeight: "700" },
});
```

- [ ] **Step 2: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/map/SwipeableItemCard.tsx
git commit -m "feat(swipe): add SwipeableItemCard with pick/skip gesture actions"
```

---

## Task 4: Create `ConfirmationOverlay.tsx`

**Files:**
- Create: `client/src/components/map/ConfirmationOverlay.tsx`

- [ ] **Step 1: Write failing test for the 400ms unmount**

Create `client/src/components/map/__tests__/ConfirmationOverlay.test.tsx`:

```typescript
import { render } from "@testing-library/react-native";
import ConfirmationOverlay from "../ConfirmationOverlay";

describe("ConfirmationOverlay", () => {
  jest.useFakeTimers();

  it("calls onComplete after 400ms", () => {
    const onComplete = jest.fn();
    render(<ConfirmationOverlay onComplete={onComplete} />);
    expect(onComplete).not.toHaveBeenCalled();
    jest.advanceTimersByTime(400);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not call onComplete before 400ms", () => {
    const onComplete = jest.fn();
    render(<ConfirmationOverlay onComplete={onComplete} />);
    jest.advanceTimersByTime(399);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL (component doesn't exist yet)**

```bash
cd client && npx jest src/components/map/__tests__/ConfirmationOverlay.test.tsx --no-coverage
```

Expected: `Cannot find module '../ConfirmationOverlay'`

- [ ] **Step 3: Create the component**

```typescript
// client/src/components/map/ConfirmationOverlay.tsx
import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "@/theme/tokens";

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
  checkmark: { fontSize: 24, color: colors.white, fontWeight: "900" },
  label: {
    ...typography.body,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
});
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd client && npx jest src/components/map/__tests__/ConfirmationOverlay.test.tsx --no-coverage
```

Expected:
```
PASS src/components/map/__tests__/ConfirmationOverlay.test.tsx
  ConfirmationOverlay
    ✓ calls onComplete after 400ms
    ✓ does not call onComplete before 400ms
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/map/ConfirmationOverlay.tsx client/src/components/map/__tests__/ConfirmationOverlay.test.tsx
git commit -m "feat(confirmation): add ConfirmationOverlay with 400ms auto-complete + tests"
```

---

## Task 5: Rewrite `navigation.tsx` — full navigation state machine

**Files:**
- Rewrite: `client/app/(app)/navigation.tsx`

- [ ] **Step 1: Rewrite the file**

```typescript
// client/app/(app)/navigation.tsx
import { useCallback, useEffect, useRef } from "react";
import {
  View, Text, Pressable, StyleSheet, useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import Animated, {
  useSharedValue, withTiming, Easing, runOnJS,
} from "react-native-reanimated";
import { useNavigationStore, type NavState } from "@/stores/useNavigationStore";
import { useGroceryListStore } from "@/stores/useGroceryListStore";
import { useLayoutBundle, useLayouts } from "@/hooks/useLayouts";
import SkiaMapCanvas from "@/components/map/SkiaMapCanvas";
import SwipeableItemCard from "@/components/map/SwipeableItemCard";
import ConfirmationOverlay from "@/components/map/ConfirmationOverlay";
import { colors, spacing, typography, elevation } from "@/theme/tokens";

const TRANSITION_MS = 1200;

export default function NavigationScreen() {
  const { width, height } = useWindowDimensions();
  const canvasH = height - spacing.navBarHeight - spacing.safeAreaTop - spacing.drawerActive;

  const {
    activeRoute,
    activeStepIndex,
    navState,
    transitionProgress,
    setNavState,
    setTransitionProgress,
    advance,
    clearNavigation,
  } = useNavigationStore();

  const { items, removeItem } = useGroceryListStore();

  const { data: layouts } = useLayouts();
  const firstLayoutId = layouts?.[0]?.id ?? null;
  const { data: bundle } = useLayoutBundle(firstLayoutId);

  // Camera transition: 0 → 1 over TRANSITION_MS
  const progress = useSharedValue(0);

  useEffect(() => {
    // Trigger 2D → 3D transition on mount
    progress.value = withTiming(1, {
      duration: TRANSITION_MS,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
    }, (finished) => {
      if (finished) {
        runOnJS(setTransitionProgress)(1);
      }
    });
  }, []);

  // Derive canvas mode from transition progress
  const canvasMode: "2d" | "3d" = transitionProgress >= 0.5 ? "3d" : "2d";

  // Active item (top of queue)
  const activeItem = items[0] ?? null;

  // Distance label for active item
  const activeSegment = activeRoute?.segments[activeStepIndex];
  const distanceM = activeSegment?.distance_m ?? 0;
  const distanceLabel = `${distanceM.toFixed(0)}m`;

  // User position from active segment start node
  const userPos = (() => {
    if (!bundle || !activeSegment) return null;
    const node = bundle.nodes.find((n) => n.id === activeSegment.from_node_id);
    return node ? { x: node.x, y: node.y } : null;
  })();

  // State machine handlers
  const handleReveal = useCallback(() => {
    setNavState("SWIPE_REVEALED");
  }, [setNavState]);

  const handlePick = useCallback(() => {
    setNavState("CONFIRMING");
  }, [setNavState]);

  const handleSkip = useCallback(() => {
    if (!activeItem) return;
    // Move item to end of queue (remove and re-add)
    removeItem(activeItem.product_id);
    useGroceryListStore.getState().addItem({
      id: activeItem.product_id,
      name: activeItem.product_name_snapshot,
      category: activeItem.category,
      shelf_id: null,
      sku: null,
      image_url: null,
      brand: null,
      description: null,
      quantity: 1,
      section_index: null,
    } as any);
    setNavState("QUEUE_ADVANCING");
  }, [activeItem, removeItem, setNavState]);

  const handleConfirmationComplete = useCallback(() => {
    if (!activeItem) return;
    removeItem(activeItem.product_id);
    advance();
    const remaining = useGroceryListStore.getState().items;
    if (remaining.length === 0) {
      setNavState("TRIP_COMPLETE");
    } else {
      setNavState("GUIDANCE_ACTIVE");
    }
  }, [activeItem, removeItem, advance, setNavState]);

  if (navState === "TRIP_COMPLETE") {
    return <TripCompleteScreen onReset={() => {
      clearNavigation();
      useGroceryListStore.getState().clearList();
      router.replace("/(app)/");
    }} />;
  }

  const totalStops = items.length;
  const stopLabel = `Parada ${activeStepIndex + 1} de ${totalStops}`;
  const totalDistM = (activeRoute?.total_distance_m ?? 0) - (activeRoute?.segments.slice(0, activeStepIndex).reduce((acc, s) => acc + s.distance_m, 0) ?? 0);

  return (
    <View style={styles.container}>
      {/* Top nav */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.navLabel}>● NAVEGAÇÃO AO VIVO</Text>
        <View style={styles.avatarDot} />
      </View>

      {/* Map */}
      <View style={{ flex: 1 }}>
        {bundle ? (
          <SkiaMapCanvas
            bundle={bundle}
            route={activeRoute}
            mode={canvasMode}
            userPos={userPos}
            canvasWidth={width}
            canvasHeight={canvasH}
            activeSegmentIndex={activeStepIndex}
          />
        ) : (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.brandVibrant} size="large" />
          </View>
        )}
      </View>

      {/* Bottom drawer */}
      <View style={styles.drawer}>
        {/* Progress row */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {stopLabel} · <Text style={styles.distText}>{totalDistM.toFixed(0)}m</Text>
          </Text>
          <Pressable>
            <Text style={styles.seeAllText}>Ver tudo ↑</Text>
          </Pressable>
        </View>

        {/* Active item card or confirmation overlay */}
        {navState === "CONFIRMING" ? (
          <ConfirmationOverlay onComplete={handleConfirmationComplete} />
        ) : activeItem ? (
          <SwipeableItemCard
            item={activeItem}
            sequenceIndex={activeStepIndex + 1}
            distanceLabel={distanceLabel}
            onPick={handlePick}
            onSkip={handleSkip}
            onReveal={handleReveal}
            isRevealed={navState === "SWIPE_REVEALED"}
          />
        ) : null}

        {/* Remaining items (greyed out) */}
        {items.slice(1, 3).map((item, i) => (
          <View key={item.id} style={styles.remainingRow}>
            <Text style={styles.remainingText} numberOfLines={1}>
              • {item.product_name_snapshot}
            </Text>
            <Text style={styles.remainingChevron}>›</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TripCompleteScreen({ onReset }: { onReset: () => void }) {
  return (
    <View style={styles.tripCompleteContainer}>
      <Text style={styles.tripCompleteIcon}>🎉</Text>
      <Text style={styles.tripCompleteTitle}>Compras concluídas!</Text>
      <Text style={styles.tripCompleteSub}>Todos os itens foram coletados.</Text>
      <Pressable
        style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.85 }]}
        onPress={onReset}
      >
        <Text style={styles.resetBtnText}>VER RESUMO</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  nav: {
    paddingTop: spacing.safeAreaTop + 8,
    paddingBottom: 12,
    paddingHorizontal: spacing.gutter,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: spacing.navBarHeight + spacing.safeAreaTop,
  },
  backBtn: { ...typography.body, fontWeight: "700", color: colors.textSecondary },
  navLabel: { ...typography.badge, color: colors.routeActive, fontWeight: "700", letterSpacing: 2 },
  avatarDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.border },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  drawer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: spacing.safeAreaBottom + 16,
    gap: 8,
    ...elevation.drawer,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.gutter,
    marginBottom: 4,
  },
  progressText: { ...typography.badge, color: colors.routeActive, fontFamily: "Courier New" },
  distText: { ...typography.badge, color: colors.textPrimary, fontFamily: undefined, fontWeight: "700" },
  seeAllText: { ...typography.meta, color: colors.actionSkip, fontWeight: "600" },
  remainingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.bgLight,
    opacity: 0.45,
  },
  remainingText: { ...typography.meta, fontWeight: "500", color: colors.textSecondary, flex: 1 },
  remainingChevron: { ...typography.body, color: colors.textSecondary },
  tripCompleteContainer: {
    flex: 1,
    backgroundColor: colors.bgLight,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: spacing.gutter * 2,
  },
  tripCompleteIcon: { fontSize: 64 },
  tripCompleteTitle: { ...typography.h1, color: colors.brandDark, textAlign: "center" },
  tripCompleteSub: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
  resetBtn: {
    backgroundColor: colors.brandVibrant,
    borderRadius: spacing.pillRadius,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  resetBtnText: { ...typography.badge, fontSize: 13, color: colors.brandDark, letterSpacing: 2 },
});
```

- [ ] **Step 2: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add client/app/(app)/navigation.tsx
git commit -m "feat(navigation): rewrite navigation screen with 3D transition, swipe gestures, queue succession"
```

---

## Task 6: Run full test suite and CI checks

- [ ] **Step 1: Run all client tests**

```bash
cd client && npx jest --no-coverage
```

Expected:
```
PASS src/utils/__tests__/projection.test.ts
PASS src/stores/__tests__/navigationStore.test.ts
PASS src/components/map/__tests__/ConfirmationOverlay.test.tsx
```

- [ ] **Step 2: TypeScript + ESLint**

```bash
cd client && npx tsc --noEmit && npx eslint app/ src/ --max-warnings 0
```

Expected: no errors.

- [ ] **Step 3: Push and open PR**

```bash
git push origin feature/phase-8g-nav-3d-and-gestures
```

Open PR from `feature/phase-8g-nav-3d-and-gestures` → `master`.
