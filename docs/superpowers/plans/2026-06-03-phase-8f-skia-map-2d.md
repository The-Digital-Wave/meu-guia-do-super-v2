# Phase 8f — Skia 2D Map Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all existing canvas/SVG map components with a `@shopify/react-native-skia` implementation. Build the `projection.ts` affine math helpers, the Skia layer stack (shelves, route path, waypoint badges, aisle callouts, user dot), and rewrite `map.tsx` as the 2D orthographic overview screen (Screen 12).

**Architecture:** `SkiaMapCanvas` is a pure rendering component receiving `bundle`, `route`, `mode`, and `userPos` as props. All coordinate transforms go through `projection.ts`. Gesture handling uses `react-native-gesture-handler` wrapped around the `<Canvas>`. The `map.tsx` screen manages layout resolution and the "Iniciar" CTA that triggers the Phase 8g transition.

**Tech Stack:** `@shopify/react-native-skia`, `react-native-gesture-handler`, `react-native-reanimated`, TypeScript

**Branch:** `feature/phase-8f-skia-map-2d` (cut after 8e merges)

**Prerequisite:** Phase 8e merged, `@shopify/react-native-skia` installed (Phase 8b).

---

## File Map

| Action | Path |
|--------|------|
| Create | `client/src/utils/projection.ts` |
| Create | `client/src/utils/skiaHelpers.ts` |
| Create | `client/src/components/map/SkiaMapCanvas.tsx` |
| Create | `client/src/components/map/AisleCallout.tsx` |
| Create | `client/src/components/map/WaypointBadge.tsx` |
| Create | `client/src/components/map/RouteOverlay.tsx` |
| Delete | `client/src/components/map/MapCanvas.tsx` |
| Delete | `client/src/components/map/MiniMap.tsx` |
| Delete | `client/src/components/map/PickListItem.tsx` |
| Delete | `client/src/components/map/PickListPanel.tsx` |
| Delete | `client/src/components/wayfinding/WayfindingCanvas.tsx` |
| Delete | `client/src/components/wayfinding/WayfindingControls.tsx` |
| Delete | `client/src/components/wayfinding/WayfindingFAB.tsx` |
| Delete | `client/src/components/wayfinding/WayfindingStepList.tsx` |
| Rewrite | `client/app/(app)/map.tsx` |
| Modify  | `client/app/(app)/index.tsx` (wire SkiaMapCanvas into LoadedState) |

---

## Task 1: Create `projection.ts`

**Files:**
- Create: `client/src/utils/projection.ts`

- [ ] **Step 1: Write the projection helpers**

```typescript
// client/src/utils/projection.ts

export interface ScreenPoint { sx: number; sy: number }

/**
 * 2D orthographic projection — maps layout metres to canvas pixels.
 * pan and zoom are Reanimated shared values passed as plain numbers at render time.
 */
export function toScreen2D(
  x: number,
  y: number,
  layoutW: number,
  layoutH: number,
  canvasW: number,
  canvasH: number,
  panX: number,
  panY: number,
  zoom: number,
): ScreenPoint {
  const scaleX = (canvasW * zoom) / layoutW;
  const scaleY = (canvasH * zoom) / layoutH;
  // Use the smaller scale to maintain aspect ratio, centred in canvas
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (canvasW - layoutW * scale) / 2;
  const offsetY = (canvasH - layoutH * scale) / 2;
  return {
    sx: x * scale + offsetX + panX,
    sy: y * scale + offsetY + panY,
  };
}

/**
 * 3D axonometric parallel projection — pitch 30°, yaw 45°.
 * Coordinates are relative to the user position (centred on user).
 *
 * The transformation matrix (derived from the spec):
 *   u = K * (cos45° * (X - Xu) - cos45° * (Y - Yu))
 *   v = K * (sin45° * sin30° * (X - Xu) + sin45° * sin30° * (Y - Yu) - cos30° * Z)
 *
 * For floor-plane coordinates Z = 0, so the cos30°·Z term drops.
 */
const COS45 = Math.cos(Math.PI / 4);  // ≈ 0.7071
const SIN45 = Math.sin(Math.PI / 4);  // ≈ 0.7071
const SIN30 = Math.sin(Math.PI / 6);  // = 0.5
const COS30 = Math.cos(Math.PI / 6);  // ≈ 0.8660

export function toScreen3D(
  x: number,
  y: number,
  userX: number,
  userY: number,
  canvasW: number,
  canvasH: number,
  zoom: number,
): ScreenPoint {
  const K = Math.min(canvasW, canvasH) * zoom * 0.5;
  const dx = x - userX;
  const dy = y - userY;
  const u = K * (COS45 * dx - COS45 * dy);
  const v = K * (SIN45 * SIN30 * dx + SIN45 * SIN30 * dy);
  return {
    sx: canvasW / 2 + u,
    sy: canvasH / 2 + v,
  };
}

/**
 * Returns the canvas-pixel size of one layout metre in 2D mode.
 * Used to scale shelf rectangle widths and heights.
 */
export function metreToPixel2D(
  layoutW: number,
  canvasW: number,
  canvasH: number,
  zoom: number,
): number {
  const scale = Math.min((canvasW * zoom) / layoutW, (canvasH * zoom) / layoutW);
  return scale;
}
```

- [ ] **Step 2: Write a unit test for `toScreen2D` and `toScreen3D`**

Create `client/src/utils/__tests__/projection.test.ts`:

```typescript
import { toScreen2D, toScreen3D } from "../projection";

describe("toScreen2D", () => {
  it("maps origin to canvas offset centre", () => {
    const { sx, sy } = toScreen2D(0, 0, 50, 30, 375, 600, 0, 0, 1);
    // scale = min(375/50, 600/30) = min(7.5, 20) = 7.5
    // offsetX = (375 - 50*7.5)/2 = (375-375)/2 = 0
    // offsetY = (600 - 30*7.5)/2 = (600-225)/2 = 187.5
    expect(sx).toBeCloseTo(0);
    expect(sy).toBeCloseTo(187.5);
  });

  it("maps layout centre to canvas centre when not panned", () => {
    const { sx, sy } = toScreen2D(25, 15, 50, 30, 375, 600, 0, 0, 1);
    expect(sx).toBeCloseTo(187.5);
    expect(sy).toBeCloseTo(300);
  });
});

describe("toScreen3D", () => {
  it("maps user position to canvas centre", () => {
    const { sx, sy } = toScreen3D(10, 10, 10, 10, 375, 600, 1);
    expect(sx).toBeCloseTo(375 / 2);
    expect(sy).toBeCloseTo(600 / 2);
  });

  it("point to the right of user produces positive sx offset", () => {
    const centre = toScreen3D(10, 10, 10, 10, 375, 600, 1);
    const right   = toScreen3D(11, 10, 10, 10, 375, 600, 1);
    expect(right.sx).toBeGreaterThan(centre.sx);
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
cd client && npx jest src/utils/__tests__/projection.test.ts --no-coverage
```

Expected:
```
PASS src/utils/__tests__/projection.test.ts
  toScreen2D
    ✓ maps origin to canvas offset centre
    ✓ maps layout centre to canvas centre when not panned
  toScreen3D
    ✓ maps user position to canvas centre
    ✓ point to the right of user produces positive sx offset
```

- [ ] **Step 4: Commit**

```bash
git add client/src/utils/projection.ts client/src/utils/__tests__/projection.test.ts
git commit -m "feat(projection): add toScreen2D, toScreen3D affine helpers + unit tests"
```

---

## Task 2: Create `skiaHelpers.ts`

**Files:**
- Create: `client/src/utils/skiaHelpers.ts`

- [ ] **Step 1: Write paint factories**

```typescript
// client/src/utils/skiaHelpers.ts
import { Paint, Skia } from "@shopify/react-native-skia";
import { colors } from "@/theme/tokens";

/** Returns a filled paint for the route active path. */
export function makeRoutePaint(): ReturnType<typeof Skia.Paint> {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(colors.routeActive));
  paint.setStrokeWidth(4);
  paint.setStyle(1 /* stroke */);
  paint.setStrokeCap(1 /* round */);
  paint.setStrokeJoin(1 /* round */);
  return paint;
}

/** Returns a filled paint for user position dot. */
export function makeUserDotPaint(): ReturnType<typeof Skia.Paint> {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(colors.userDot));
  return paint;
}

/** Returns a stroke paint for shelf outlines. */
export function makeShelfStrokePaint(): ReturnType<typeof Skia.Paint> {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(colors.border));
  paint.setStrokeWidth(1);
  paint.setStyle(1 /* stroke */);
  return paint;
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/utils/skiaHelpers.ts
git commit -m "feat(skia): add Skia paint factory helpers"
```

---

## Task 3: Create `WaypointBadge.tsx`

**Files:**
- Create: `client/src/components/map/WaypointBadge.tsx`

- [ ] **Step 1: Create the component**

```typescript
// client/src/components/map/WaypointBadge.tsx
import { Circle, Group, Text as SkiaText, useFont } from "@shopify/react-native-skia";
import { colors } from "@/theme/tokens";

interface WaypointBadgeProps {
  x: number;
  y: number;
  index: number;
  isTarget: boolean;
}

export default function WaypointBadge({ x, y, index, isTarget }: WaypointBadgeProps) {
  // Note: useFont requires a font file. For a first pass, render without text
  // and add the number overlay once a font asset is bundled.
  const fillColor = isTarget ? colors.waypointTarget : colors.routeActive;

  return (
    <Group>
      {/* Outer ring for the active target */}
      {isTarget && (
        <Circle
          cx={x}
          cy={y}
          r={14}
          color="transparent"
          style="stroke"
          strokeWidth={2}
          strokeColor={colors.brandVibrant}
        />
      )}
      {/* Core pin dot */}
      <Circle cx={x} cy={y} r={8} color={fillColor} />
      {/* White dot centre */}
      <Circle cx={x} cy={y} r={3} color={colors.white} />
    </Group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/map/WaypointBadge.tsx
git commit -m "feat(skia): add WaypointBadge Skia component"
```

---

## Task 4: Create `AisleCallout.tsx`

**Files:**
- Create: `client/src/components/map/AisleCallout.tsx`

- [ ] **Step 1: Create the component**

```typescript
// client/src/components/map/AisleCallout.tsx
import { Group, RoundedRect, Circle, Text as SkiaText } from "@shopify/react-native-skia";
import { colors } from "@/theme/tokens";

interface AisleCalloutProps {
  x: number;         // screen-space x anchor (shelf front)
  y: number;         // screen-space y anchor
  label: string;
  itemCount: number;
}

const W = 140;
const H = 36;
const R = 6;

export default function AisleCallout({ x, y, label, itemCount }: AisleCalloutProps) {
  const rectX = x - W / 2;
  const rectY = y - H - 10;

  return (
    <Group>
      {/* Background rect */}
      <RoundedRect
        x={rectX}
        y={rectY}
        width={W}
        height={H}
        r={R}
        color={colors.brandDark}
      />

      {/* Arrow pointer */}
      {/* Drawn as a thin triangle below the rect */}
      {/* Skia doesn't have a built-in triangle — use Path */}

      {/* Badge circle */}
      <Circle
        cx={rectX + 16}
        cy={rectY + H / 2}
        r={8}
        color={colors.brandVibrant}
      />

      {/* Item count text — requires a loaded font; placeholder circle for now */}
      <Circle
        cx={rectX + 16}
        cy={rectY + H / 2}
        r={2}
        color={colors.brandDark}
      />
    </Group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/map/AisleCallout.tsx
git commit -m "feat(skia): add AisleCallout Skia component"
```

---

## Task 5: Create `RouteOverlay.tsx`

**Files:**
- Create: `client/src/components/map/RouteOverlay.tsx`

- [ ] **Step 1: Create the component**

```typescript
// client/src/components/map/RouteOverlay.tsx
import { Path, Skia } from "@shopify/react-native-skia";
import type { RouteResponse, Node } from "@/types";
import { toScreen2D, toScreen3D, type ScreenPoint } from "@/utils/projection";
import { colors } from "@/theme/tokens";

interface RouteOverlayProps {
  route: RouteResponse;
  nodes: Node[];
  layoutW: number;
  layoutH: number;
  canvasW: number;
  canvasH: number;
  panX: number;
  panY: number;
  zoom: number;
  mode: "2d" | "3d";
  userX: number;
  userY: number;
}

function project(
  x: number, y: number,
  mode: "2d" | "3d",
  lW: number, lH: number,
  cW: number, cH: number,
  panX: number, panY: number,
  zoom: number,
  uX: number, uY: number,
): ScreenPoint {
  return mode === "2d"
    ? toScreen2D(x, y, lW, lH, cW, cH, panX, panY, zoom)
    : toScreen3D(x, y, uX, uY, cW, cH, zoom);
}

export default function RouteOverlay({
  route, nodes, layoutW, layoutH, canvasW, canvasH,
  panX, panY, zoom, mode, userX, userY,
}: RouteOverlayProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build a Skia Path from all route segments
  const path = Skia.Path.Make();

  let firstPoint = true;
  for (const segment of route.segments) {
    for (const nodeId of segment.path_nodes) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;
      const { sx, sy } = project(
        node.x, node.y, mode, layoutW, layoutH, canvasW, canvasH, panX, panY, zoom, userX, userY
      );
      if (firstPoint) {
        path.moveTo(sx, sy);
        firstPoint = false;
      } else {
        path.lineTo(sx, sy);
      }
    }
  }

  return (
    <Path
      path={path}
      color={colors.routeActive}
      style="stroke"
      strokeWidth={4}
      strokeCap="round"
      strokeJoin="round"
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/map/RouteOverlay.tsx
git commit -m "feat(skia): add RouteOverlay Skia path component"
```

---

## Task 6: Create `SkiaMapCanvas.tsx`

**Files:**
- Create: `client/src/components/map/SkiaMapCanvas.tsx`

- [ ] **Step 1: Create the main canvas component**

```typescript
// client/src/components/map/SkiaMapCanvas.tsx
import { useCallback } from "react";
import { StyleSheet } from "react-native";
import { Canvas, Circle, Group, Rect, RoundedRect } from "@shopify/react-native-skia";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue, useAnimatedStyle, runOnJS,
} from "react-native-reanimated";
import type { LayoutBundle, RouteResponse } from "@/types";
import { toScreen2D, toScreen3D } from "@/utils/projection";
import RouteOverlay from "./RouteOverlay";
import WaypointBadge from "./WaypointBadge";
import { colors } from "@/theme/tokens";

interface SkiaMapCanvasProps {
  bundle: LayoutBundle;
  route: RouteResponse | null;
  mode: "2d" | "3d";
  userPos: { x: number; y: number } | null;
  canvasWidth: number;
  canvasHeight: number;
  activeSegmentIndex?: number;
}

export default function SkiaMapCanvas({
  bundle, route, mode, userPos, canvasWidth, canvasHeight, activeSegmentIndex = 0,
}: SkiaMapCanvasProps) {
  const { layout, shelves, nodes } = bundle;

  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const zoom = useSharedValue(1);
  const savedPanX = useSharedValue(0);
  const savedPanY = useSharedValue(0);
  const savedZoom = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedPanX.value = panX.value;
      savedPanY.value = panY.value;
    })
    .onUpdate((e) => {
      panX.value = savedPanX.value + e.translationX;
      panY.value = savedPanY.value + e.translationY;
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => { savedZoom.value = zoom.value; })
    .onUpdate((e) => {
      zoom.value = Math.min(4, Math.max(0.5, savedZoom.value * e.scale));
    });

  const combined = Gesture.Simultaneous(panGesture, pinchGesture);

  function project(x: number, y: number) {
    const uX = userPos?.x ?? layout.width_m / 2;
    const uY = userPos?.y ?? layout.height_m / 2;
    return mode === "2d"
      ? toScreen2D(x, y, layout.width_m, layout.height_m, canvasWidth, canvasHeight, panX.value, panY.value, zoom.value)
      : toScreen3D(x, y, uX, uY, canvasWidth, canvasHeight, zoom.value);
  }

  // Compute metre-to-pixel scale for shelf sizing
  const scale2D = Math.min(
    (canvasWidth * zoom.value) / layout.width_m,
    (canvasHeight * zoom.value) / layout.height_m,
  );

  // User position screen coords
  const userScreen = userPos ? project(userPos.x, userPos.y) : null;

  return (
    <GestureDetector gesture={combined}>
      <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
        {/* Layer 1: Floor fill */}
        <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} color={colors.bgLight} />

        {/* Layer 2: Shelves */}
        {shelves.map((shelf) => {
          if (!shelf.x || !shelf.y || !shelf.width || !shelf.height) return null;
          const { sx, sy } = project(shelf.x, shelf.y);
          const w = (shelf.width ?? 2) * scale2D;
          const h = (shelf.height ?? 1) * scale2D;
          return (
            <Group key={shelf.id}>
              <RoundedRect
                x={sx - w / 2}
                y={sy - h / 2}
                width={w}
                height={h}
                r={3}
                color={shelf.color || "#1f6f5f"}
              />
            </Group>
          );
        })}

        {/* Layer 3: Route overlay */}
        {route && (
          <RouteOverlay
            route={route}
            nodes={nodes}
            layoutW={layout.width_m}
            layoutH={layout.height_m}
            canvasW={canvasWidth}
            canvasH={canvasHeight}
            panX={panX.value}
            panY={panY.value}
            zoom={zoom.value}
            mode={mode}
            userX={userPos?.x ?? 0}
            userY={userPos?.y ?? 0}
          />
        )}

        {/* Layer 4: Waypoint badges */}
        {route && route.segments.map((seg, i) => {
          if (!seg.shelf_front_x || !seg.shelf_front_y) return null;
          const { sx, sy } = project(seg.shelf_front_x, seg.shelf_front_y);
          return (
            <WaypointBadge
              key={i}
              x={sx}
              y={sy}
              index={i + 1}
              isTarget={i === activeSegmentIndex}
            />
          );
        })}

        {/* Layer 5: User dot */}
        {userScreen && (
          <Group>
            <Circle cx={userScreen.sx} cy={userScreen.sy} r={8} color="rgba(59,130,246,0.2)" />
            <Circle cx={userScreen.sx} cy={userScreen.sy} r={6} color={colors.userDot} />
            <Circle cx={userScreen.sx} cy={userScreen.sy} r={2} color={colors.white} />
          </Group>
        )}
      </Canvas>
    </GestureDetector>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/map/SkiaMapCanvas.tsx
git commit -m "feat(skia): add SkiaMapCanvas with 2D/3D mode, gestures, shelves, route, waypoints"
```

---

## Task 7: Delete old canvas components

- [ ] **Step 1: Delete replaced files**

```bash
cd client
rm src/components/map/MapCanvas.tsx
rm src/components/map/MiniMap.tsx
rm src/components/map/PickListItem.tsx
rm src/components/map/PickListPanel.tsx
rm src/components/wayfinding/WayfindingCanvas.tsx
rm src/components/wayfinding/WayfindingControls.tsx
rm src/components/wayfinding/WayfindingFAB.tsx
rm src/components/wayfinding/WayfindingStepList.tsx
```

- [ ] **Step 2: TypeScript check — fix any remaining import errors**

```bash
cd client && npx tsc --noEmit
```

Fix any import errors in other files that referenced the deleted components.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete old canvas/wayfinding components replaced by Skia"
```

---

## Task 8: Rewrite `map.tsx` — 2D overview screen

**Files:**
- Rewrite: `client/app/(app)/map.tsx`

- [ ] **Step 1: Rewrite the file**

```typescript
// client/app/(app)/map.tsx
import { useState } from "react";
import {
  View, Text, Pressable, StyleSheet, useWindowDimensions, ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useLayoutBundle, useLayouts } from "@/hooks/useLayouts";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { useGroceryListStore } from "@/stores/useGroceryListStore";
import SkiaMapCanvas from "@/components/map/SkiaMapCanvas";
import { colors, spacing, typography, elevation } from "@/theme/tokens";
import { api } from "@/services/api";

export default function MapScreen() {
  const { width, height } = useWindowDimensions();
  const canvasH = height - spacing.navBarHeight - spacing.safeAreaTop - spacing.drawerPeek;

  const {
    activeSupermarketId,
    activeRoute,
    setActiveRoute,
  } = useNavigationStore();

  const { items } = useGroceryListStore();

  const { data: layouts } = useLayouts();
  const firstLayoutId = layouts?.[0]?.id ?? null;
  const { data: bundle, isLoading } = useLayoutBundle(firstLayoutId);

  const [routeLoading, setRouteLoading] = useState(false);

  async function handleStartNavigation() {
    if (!bundle || items.length === 0) return;
    setRouteLoading(true);
    try {
      const startNodeId = bundle.nodes.find((n) => n.node_type === "ENTRY")?.id;
      if (!startNodeId) throw new Error("No entry node");

      const productIds = items.map((i) => i.product_id);
      const { data } = await api.post("/navigation/route", {
        layout_id: bundle.layout.id,
        start_node_id: startNodeId,
        product_ids: productIds,
      });
      setActiveRoute(data);
      router.push("/(app)/navigation");
    } catch {
      // TODO Phase 8g: show error toast
    } finally {
      setRouteLoading(false);
    }
  }

  const totalDistance = activeRoute
    ? `${activeRoute.total_distance_m.toFixed(0)}m`
    : "—";

  return (
    <View style={styles.container}>
      {/* Top nav */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.navLabel}>VISÃO DA ROTA</Text>
        <View style={styles.avatarDot} />
      </View>

      {/* Map canvas */}
      <View style={{ flex: 1 }}>
        {isLoading || !bundle ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.brandVibrant} size="large" />
          </View>
        ) : (
          <SkiaMapCanvas
            bundle={bundle}
            route={activeRoute}
            mode="2d"
            userPos={null}
            canvasWidth={width}
            canvasHeight={canvasH}
          />
        )}

        {/* Compass rose */}
        <View style={styles.compass}>
          <Text style={styles.compassN}>N</Text>
          <Text style={styles.compassArrow}>▲</Text>
        </View>
      </View>

      {/* Bottom drawer (peek) */}
      <View style={styles.drawer}>
        <View style={styles.drawerInfo}>
          <Text style={styles.drawerTitle}>Minha Lista</Text>
          <Text style={styles.drawerMeta}>
            {items.length} {items.length === 1 ? "item" : "itens"} · {totalDistance}
          </Text>
        </View>
        <View style={styles.drawerCtas}>
          <Pressable
            style={({ pressed }) => [styles.ctaStart, pressed && { opacity: 0.85 }]}
            onPress={handleStartNavigation}
            disabled={routeLoading || items.length === 0}
          >
            {routeLoading
              ? <ActivityIndicator color={colors.white} size="small" />
              : <Text style={styles.ctaStartText}>Iniciar</Text>
            }
          </Pressable>
          <Pressable
            style={styles.ctaItems}
            onPress={() => router.push("/(app)/list")}
          >
            <Text style={styles.ctaItemsText}>Ver itens</Text>
          </Pressable>
        </View>
      </View>
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
  navLabel: { ...typography.badge, color: colors.textSecondary, letterSpacing: 2 },
  avatarDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.border },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  compass: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  compassN: { ...typography.badge, color: colors.brandDark, fontWeight: "700" },
  compassArrow: { fontSize: 14, color: colors.brandDark, transform: [{ rotate: "-12deg" }] },
  drawer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.gutter,
    paddingTop: 16,
    paddingBottom: spacing.safeAreaBottom + 8,
    gap: 12,
    ...elevation.drawer,
  },
  drawerInfo: { gap: 2 },
  drawerTitle: { ...typography.h2, color: colors.brandDark },
  drawerMeta: { ...typography.meta, color: colors.textSecondary, fontWeight: "500" },
  drawerCtas: { flexDirection: "row", gap: 12 },
  ctaStart: {
    flex: 1,
    backgroundColor: "#9CCC65",
    borderRadius: spacing.pillRadius,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaStartText: { ...typography.badge, fontSize: 12, color: colors.white, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" },
  ctaItems: {
    flex: 1,
    backgroundColor: colors.actionSkip,
    borderRadius: spacing.pillRadius,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaItemsText: { ...typography.badge, fontSize: 12, color: colors.white, fontWeight: "600", letterSpacing: 1 },
});
```

- [ ] **Step 2: Wire `SkiaMapCanvas` into `LoadedState` in `index.tsx`**

In `client/app/(app)/index.tsx`, update `LoadedState` to render `SkiaMapCanvas`:

```typescript
import { useWindowDimensions } from "react-native";
import { useLayoutBundle, useLayouts } from "@/hooks/useLayouts";
import SkiaMapCanvas from "@/components/map/SkiaMapCanvas";
// ... inside LoadedState:
function LoadedState() {
  const { width, height } = useWindowDimensions();
  const { data: layouts } = useLayouts();
  const firstLayoutId = layouts?.[0]?.id ?? null;
  const { data: bundle } = useLayoutBundle(firstLayoutId);
  if (!bundle) return <View style={styles.loadedContainer} />;
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
```

- [ ] **Step 3: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add client/app/(app)/map.tsx client/app/(app)/index.tsx
git commit -m "feat(map): rewrite map screen with SkiaMapCanvas 2D overview and Iniciar CTA"
```

---

## Task 9: CI checks and push

- [ ] **Step 1: Full checks**

```bash
cd client && npx tsc --noEmit && npx jest src/utils/__tests__/ --no-coverage
```

Expected: TypeScript clean, projection tests pass.

- [ ] **Step 2: Push and open PR**

```bash
git push origin feature/phase-8f-skia-map-2d
```

Open PR from `feature/phase-8f-skia-map-2d` → `master`.
