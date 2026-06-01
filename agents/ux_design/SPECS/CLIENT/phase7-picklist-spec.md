# Phase 7 — Pick&Pack Visual Parity Refactor: Component Specifications

**Agent:** UX Design Agent
**Phase:** 7 — Pick&Pack Visual Parity Refactor
**Benchmark:** MappedIn Grocery Store Demo (https://app.mappedin.com/map/6679882a8298d5000b85ee89)
**Design tokens source:** `agents/ux_design/design_tokens.json`
**Status:** Handoff-ready for Client Agent

---

## Design Token Quick Reference

| Token | Value | Usage in this phase |
|---|---|---|
| `greenAccent` | `#00754A` | Product pins, CTAs, user position ring, borders |
| `houseGreen` | `#1E3932` | FAB background, dark header |
| `neutralWarm` | `#f2f0eb` | Page canvas |
| `white` | `#ffffff` | Pin number text, user dot |
| `error` | `#c82014` | Active item badge (red number circle) |
| `radiusCard` | `12px` | Panel corners, MiniMap corners |
| `radiusButton` | `50px` | Primary CTA full-pill |
| `shadowFrap` | see tokens | Floating panels and FAB |
| `durationNormal` | `300ms` | Default animation duration |
| `durationSlow` | `400ms` | Swipe action expand |

Additional values used in this phase that are not in the token file:

| Name | Value | Rationale |
|---|---|---|
| `routePath` | `#90d030` | Yellow-green; MappedIn route parity |
| `routePathWidth` | `4px` | Visible over map without overwhelming |
| `skipAction` | `#5b9b9b` | Teal; distinct from primary/error actions |
| `pickedAction` | `#5bad27` | Lime green; affirmative completion |
| `waypointHighlight` | `#FFD700` | Yellow; current waypoint in MiniMap |
| `dragHandle` | `#d1d5db` | Neutral gray; standard bottom-sheet handle |
| `subtleText` | `#8e8e93` | iOS system gray; shelf label / distance |
| `collectLabel` | `#666666` | Mid-gray; "Colete agora" sub-label |

---

## 1. MapCanvas (modified)

**File:** `client/src/components/WayfindingCanvas.tsx` (or equivalent map canvas component)

### Purpose

SVG-based indoor map renderer. Phase 7 adds shelf coloring, numbered product pins, bearing rotation, 3-D tilt mode, and a styled route path + user position indicator.

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `shelves` | `Shelf[]` | Yes | Array of shelf objects to render as colored rectangles |
| `productPins` | `ProductPin[]` | No | Numbered markers for items on the active pick list |
| `bearingDeg` | `number` | No (default `0`) | Compass bearing in degrees; rotates the SVG content group by `-bearingDeg` |
| `tiltEnabled` | `boolean` | No (default `false`) | Enables 3-D perspective tilt on the map container |
| `routePath` | `string[]` | No | Ordered array of node IDs forming the active route |
| `userPosition` | `{nodeId: string; x: number; y: number}` | No | Current user position in SVG coordinates |
| `onShelfPress` | `(shelfId: string) => void` | No | Callback when a shelf rect is tapped |
| `onPinPress` | `(nodeId: string) => void` | No | Callback when a product pin is tapped |

#### Supporting types

```ts
interface Shelf {
  id: string;
  label: string;
  x: number;       // SVG coordinate
  y: number;
  width: number;
  height: number;
  color: string;   // hex; rendered at 30% fill opacity, 100% stroke opacity
}

interface ProductPin {
  nodeId: string;
  number: number;  // 1-based stop index
  label: string;   // product short name; shown in tooltip on press
  x: number;       // SVG coordinate of pin center
  y: number;
}
```

### SVG Z-order (bottom to top)

1. Shelf `<Rect>` elements (fill + stroke)
2. Graph edge `<Line>` elements
3. Intersection node `<Circle>` elements (walkable graph nodes)
4. Route path `<Polyline>` or `<Path>`
5. Product pin `<Circle>` + `<Text>` groups
6. User position ring + pulse halo

### Shelf rendering

- Element: `<Rect>`
- Fill: `shelf.color` at **30% opacity** (`fillOpacity={0.3}`)
- Stroke: `shelf.color` at **100% opacity** (`stroke={shelf.color}` `strokeWidth={1.5}`)
- Label: `<Text>` centered inside the rect; font size `10px`; fill `#000000` at 70% opacity; font weight `600`
- Label truncation: clip to shelf width minus `8px` padding each side

### Product pin rendering

- Element: `<Circle r={14}>`
- Fill: `#00754A` (greenAccent)
- Stroke: `#ffffff` (white), `strokeWidth={2}`
- Number label: `<Text>` centered on circle; fill `#ffffff`; font size `12px`; font weight `700`
- Press target: hitSlop `10px` all sides
- On press: call `onPinPress(nodeId)` and show a tooltip `<Text>` tag with `label` above the pin for `2000ms`

### Route path rendering

- Element: `<Polyline>` connecting route node coordinates
- Stroke: `#90d030` (yellow-green)
- Stroke width: `4px`
- Stroke line cap: `round`
- Stroke line join: `round`
- Animation: `stroke-dasharray` set to total path length; `stroke-dashoffset` animates from full path length to `0` over `600ms` `ease-in-out` on mount; re-runs whenever `routePath` changes
- Implementation note: use `react-native-svg` `Animated` wrapper or `react-native-reanimated` SVG path plugin

### User position rendering

| Layer | Element | Style |
|---|---|---|
| Outer pulse halo | `<Circle>` | r=22, fill=`#00754A` at 20% opacity; scale-pulsing animation 0.85 to 1.15 over 1200ms repeat |
| Green stroke ring | `<Circle>` | r=16, fill=`none`, stroke=`#00754A`, strokeWidth=3 |
| White dot | `<Circle>` | r=10, fill=`#ffffff` |

Pulse animation: `Animated.loop(Animated.sequence([scale 0.85 to 1.15 over 600ms, scale 1.15 to 0.85 over 600ms]))` — starts on mount, stops when component unmounts.

### Bearing rotation

- Wrap all rendered SVG content (shelves, edges, nodes, route, pins, user) in a single `<G>` element.
- Apply transform: `rotate(-bearingDeg, ux, uy)` where `(ux, uy)` is the user's current SVG coordinate.
- If `userPosition` is undefined, rotate around the SVG viewport center.
- Update is not animated (instant tracking); bearing changes from device sensor should be debounced at 16ms by the parent before passing as prop.

### Tilt mode (3-D perspective)

- When `tiltEnabled === true`: wrap the `<Svg>` element in `Animated.View` with style:
  ```
  transform: [
    { perspective: 500 },
    { rotateX: '30deg' }
  ]
  ```
- Animate on enable: `rotateX` interpolates `'0deg'` to `'30deg'` over `600ms` with `Easing.ease`.
- Animate on disable: `rotateX` interpolates `'30deg'` to `'0deg'` over `600ms` with `Easing.ease`.
- Use `useRef(new Animated.Value(0))` with `interpolate` outputRange `['0deg', '30deg']`.

### Interaction notes

- When no `routePath` prop is present, the route polyline is not rendered.
- When no `productPins` prop is present (or empty array), no pin layer is rendered.
- `bearingDeg` defaults to `0`; no rotation transform is applied until the prop changes from `0`.
- Shelf press and pin press callbacks are independent; neither blocks the other.

---

## 2. PickListPanel (new component)

**File:** `client/src/components/PickListPanel.tsx`

### Purpose

Bottom-sheet panel anchored below the map. Presents the ordered pick list when a route is active. Allows the user to review all stops before starting and to initiate navigation.

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `items` | `PickListItemData[]` | Yes | Ordered array of stops; see type below |
| `totalDistanceM` | `number` | Yes | Total route distance in metres |
| `estimatedMinutes` | `number` | Yes | Estimated walk + pick time in minutes |
| `currentStopIndex` | `number` | Yes | 0-based index of the active stop |
| `onStartNavigation` | `() => void` | Yes | Callback when primary CTA is tapped |
| `onItemPicked` | `(itemId: string) => void` | Yes | Callback when a list item is marked as picked |
| `onItemSkipped` | `(itemId: string) => void` | Yes | Callback when a list item is skipped |
| `visible` | `boolean` | Yes | Controls panel visibility (slide animation) |

#### Supporting type

```ts
interface PickListItemData {
  id: string;
  stopNumber: number;    // 1-based
  productName: string;
  brandLabel: string;
  shelfLabel: string;
  distanceM: number;
  status: 'upcoming' | 'active' | 'collected' | 'skipped';
}
```

### Layout

```
+----------------------------------+
|         [drag handle]            |  <- 36x4px, #d1d5db, radius 2px, centered, mt 8px
|  Stop N of M · Xm · ~Y min      |  <- summary row, 12px, #8e8e93
+----------------------------------+
|  [PickListItem] (active)         |
|  [PickListItem] (upcoming)       |  <- FlatList, scrollable
|  [PickListItem] (collected)      |
|  ...                             |
+----------------------------------+
|  [ Iniciar navegacao ->  ]       |  <- primary CTA pill
+----------------------------------+
```

### Dimensions

| Property | Value |
|---|---|
| Default height | 40% of screen height |
| Expanded height (drag up) | 70% of screen height |
| Corner radius (top corners) | `12px` |
| Background | `#ffffff` |
| Shadow | `shadowFrap` token |

### Drag handle

- Size: `36px` wide x `4px` tall
- Border radius: `2px`
- Color: `#d1d5db`
- Margin top: `8px`
- Horizontally centered

### Summary row

- Text: `"Parada N de M · Xm · ~Y min"`
- Font size: `12px`
- Color: `#8e8e93`
- Margin: `8px` vertical, `16px` horizontal
- Build string: `"Parada ${n} de ${m} · ${x}m · ~${y}min"`

### FlatList

- `keyExtractor`: item `id`
- `showsVerticalScrollIndicator`: `false`
- `contentContainerStyle`: `paddingBottom: 16`
- Each row is a `PickListItem` component (see Section 3)
- `initialScrollIndex`: `currentStopIndex` (scroll to active item on open)

### Primary CTA

- Label: `"Iniciar navegacao ->"`
- Font size: `16px`, weight `700`, color `#ffffff`
- Background: `#00754A`
- Border radius: `50px`
- Height: `52px`
- Horizontal margin: `16px`
- Margin bottom: `16px` + safe area inset
- Active scale: `0.95` (`Animated.spring` on `Pressable` `onPressIn`)

### Slide-in animation

- Initial state: `translateY = panelHeight` (fully below screen)
- On `visible` prop true: `Animated.spring({ toValue: 0, tension: 100, friction: 12 })`
- On `visible` prop false: `Animated.timing({ toValue: panelHeight, duration: 300, easing: Easing.ease })`
- Use `Animated.View` wrapping the panel root `View`

### Snap behavior

- Two snap points: `40%` and `70%` of screen height
- Implement with `PanResponder` detecting `dy` gesture on the drag handle
- On release: snap to nearest point using a threshold of `15%` screen height
- Animate snap with `Animated.spring({ tension: 120, friction: 14 })`

### Interaction notes

- When `visible === false`, the panel is off-screen but mounted (avoids re-mount flicker on re-open).
- `onStartNavigation` does not dismiss the panel; the caller controls visibility.
- When all items are `'collected'` or `'skipped'`, the CTA label changes to `"Rota concluida"` with a checkmark and becomes non-interactive (opacity `0.5`).

---

## 3. PickListItem (new component)

**File:** `client/src/components/PickListItem.tsx`

### Purpose

Individual stop row within `PickListPanel`. Supports three visual states (active, upcoming, collected) and a swipe-to-action gesture revealing Skip and Picked action buttons.

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `item` | `PickListItemData` | Yes | Stop data object (see PickListPanel type) |
| `onPicked` | `(id: string) => void` | Yes | Called when Picked action confirmed |
| `onSkipped` | `(id: string) => void` | Yes | Called when Skip action tapped |

### State variants

#### Active state

The current stop being navigated toward.

| Property | Value |
|---|---|
| Left border | `3px solid #00754A` |
| Number badge | `22px` circle, fill `#c82014` (error/red), white number text `12px/700` |
| Bag icon | `38x38px`, border radius `8px`, gray background `#f2f2f2`, gray icon `#555` |
| Product name | `14px`, weight `700`, color `rgba(0,0,0,0.87)` |
| Shelf + distance | `12px`, color `#8e8e93`, format: `"[shelf label] · [distanceM]m"` |
| Chevron | `">"` character, `20px`, color `#c7c7cc`, right-aligned |
| Row height | `72px` minimum |
| Row padding | `12px` vertical, `16px` horizontal |
| Swipe | Enabled (see gesture spec below) |

#### Upcoming state

Stops later in the queue.

| Property | Value |
|---|---|
| Left border | None |
| Number badge | `22px` circle, fill `#c7c7cc` (gray), white number text `12px/700` |
| Product name | `14px`, weight `400`, color `rgba(0,0,0,0.58)` |
| Shelf + distance | `12px`, color `#c7c7cc` |
| Chevron | Not shown |
| Swipe | Disabled |
| Opacity | `1.0` (full; muted colors convey passiveness) |

#### Collected state

Items already picked (history, scrolled past).

| Property | Value |
|---|---|
| Number badge | `22px` circle, fill `#5bad27` (lime green), white checkmark |
| Product name | `14px`, weight `400`, color `rgba(0,0,0,0.87)`, **strikethrough** text decoration |
| Row opacity | `0.55` |
| Swipe | Disabled |
| Left border | None |

### Swipe gesture specification

Applies only when `item.status === 'active'`.

**Implementation:** Use `react-native-gesture-handler` `PanGestureHandler` or `PanResponder`. Track horizontal translation only.

```
Card content
  translateX: 0 ------- drag left ------> translateX: -120px (clamped)
                                               |
                                   [ Skip ] [ Picked ]
                                   #5b9b9b   #5bad27
                                    60px      60px
```

**Gesture thresholds:**

| Event | Threshold | Action |
|---|---|---|
| Drag start | `dx < -10px` | Begin swipe; clamp translateX to `[-120, 0]` |
| Release | `translateX < -60px` | Snap open (translateX to `-120px`, spring) |
| Release | `translateX > -60px` | Snap closed (translateX to `0`, spring) |
| Swipe right when open | `dx > 30px` | Snap closed |

**Action buttons (revealed behind card):**

- Container: `flexDirection: 'row'`, absolute positioned, `right: 0`, full height of row
- Skip button:
  - Width: `60px`
  - Background: `#5b9b9b`
  - Label: `"Skip"`, `12px`, white, centered
  - On press: call `onSkipped(item.id)`; snap card closed; item status changes to `'skipped'`
- Picked button:
  - Width: `60px` initial
  - Background: `#5bad27`
  - Label: `"Picked"`, `12px`, white, centered
  - On press: begin "collected" animation sequence (see below)

**Picked confirmation animation sequence:**

1. Skip button: `flex` animates `1` to `0` over `400ms` (`durationSlow`) — Skip collapses left
2. Picked button: expands to fill full width of the `120px` action area over `400ms`
3. After `400ms` delay: card row animates out:
   - `translateX`: `0` to `-(screenWidth)` over `300ms` (`durationNormal`)
   - `height`: current height to `0` over `300ms` (simultaneously)
   - `marginBottom`: current to `0` over `300ms`
4. At animation end: call `onPicked(item.id)`

**Spring config for snap:** `{ tension: 150, friction: 20 }`

### Row structure (JSX outline)

```jsx
<View> {/* outer swipe container, overflow hidden */}
  <View> {/* action buttons, absolute right */}
    <TouchableOpacity> {/* Skip */}
    <TouchableOpacity> {/* Picked */}
  </View>
  <Animated.View> {/* card content, translateX animated */}
    <View style={leftBorder} />
    <View style={badgeContainer}>
      <View style={numberBadge}>
        <Text>{stopNumber}</Text>
      </View>
    </View>
    <View style={iconContainer} />
    <View style={textContainer}>
      <Text style={productName}>{productName}</Text>
      <Text style={subText}>{shelfLabel} · {distanceM}m</Text>
    </View>
    <Text style={chevron}>›</Text>
  </Animated.View>
</View>
```

### Interaction notes

- Only one item can be in swipe-open state at a time; opening a new item snaps any currently open item closed.
- Scrolling the FlatList vertically while a card is partially swiped snaps it closed first.
- Collected and Upcoming items do not receive gesture events (`pointerEvents="none"` on PanGestureHandler).

---

## 4. MiniMap (new component)

**File:** `client/src/components/MiniMap.tsx`

### Purpose

A compact, non-interactive overview of the store map shown in the Navigation screen. Updates bearing in sync with the main map. Highlights the current waypoint in yellow.

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `bearingDeg` | `number` | Yes | Current compass bearing — rotates map content in sync with main MapCanvas |
| `currentWaypointNodeId` | `string` | Yes | Node ID of the stop being navigated to; highlighted in yellow |
| `shelves` | `Shelf[]` | Yes | Same shelf array passed to MapCanvas |
| `routePath` | `string[]` | No | Route node IDs — draws the route line at reduced scale |
| `userPosition` | `{nodeId: string; x: number; y: number}` | No | User position for the position dot |

### Dimensions

| Property | Value |
|---|---|
| Width | `120px` |
| Height | `120px` |
| Border radius | `12px` |
| Scale factor | `0.25x` of full map SVG viewBox |
| Border | `1px solid rgba(0,0,0,0.1)` |
| Background | `#ffffff` |
| Overflow | `hidden` |
| Shadow | `shadowCard` token |

### Visual differences from MapCanvas

| Feature | MapCanvas | MiniMap |
|---|---|---|
| Current waypoint node | `#00754A` (green) | `#FFD700` (yellow) highlight ring |
| User position | Animated pulse halo | Static white dot, `r=4`, no animation |
| Product pins | Numbered circles | Not rendered |
| Route path stroke | `4px` | `2px` (scaled) |
| Node circles | Rendered | Not rendered (too small at 0.25x) |
| Tap handlers | Yes | None — `pointerEvents="none"` |
| Bearing rotation | Animated on sensor | Instant update (no interpolation) |

### Current waypoint highlight

- Element: `<Circle>` at the waypoint node's SVG coordinate
- Radius: `8px` (at full scale; appears as `2px` at 0.25x)
- Fill: `#FFD700`
- Stroke: `#ffffff`, `strokeWidth=2`
- No animation

### Bearing rotation

- Same `<G transform="rotate(-bearingDeg, cx, cy)">` pattern as MapCanvas
- Center of rotation: center of the MiniMap viewport
- Update: direct (no animation debounce needed at this scale)

### Interaction notes

- Entire component is wrapped in `<View pointerEvents="none">` — no touch events pass through.
- Re-renders only when `bearingDeg`, `currentWaypointNodeId`, or `userPosition` change; memoize with `React.memo` and shallow prop comparison.
- If `routePath` is empty or undefined, no route line is drawn but other elements render normally.

---

## 5. Navigation Screen (modified)

**File:** `client/src/pages/NavigationScreen.tsx` (or equivalent)

### Purpose

Step-by-step guidance screen shown when the user is actively navigating to a product stop. Redesigned for Phase 7 to include MiniMap, clear "collect now" action, and next-stop preview.

### Screen layout (top to bottom)

```
+--------------------------------------+
|  [dark header — houseGreen #1E3932]  |
|  ████████████░░░░░░░░  N/M           |  <- progress bar + stop label
+--------------------------------------+
|  [MiniMap 120x120]  Va ate           |
|                     [Shelf name]     |  <- direction row
|                     [Aisle] · Xm    |
+--------------------------------------+
|  COLETE AGORA                        |  <- uppercase label 11px
|  [Product name 18px/700]             |  <- collection card
|  [Brand] · [Shelf sub] 13px/#666     |
+--------------------------------------+
|  [ Marcar como coletado ]            |  <- CTA pill
+--------------------------------------+
|  A seguir: [next product] (Xm)       |  <- footer preview
+--------------------------------------+
```

### Header (dark bar)

| Property | Value |
|---|---|
| Background | `#1E3932` (houseGreen) |
| Padding | `16px` horizontal, `12px` vertical + status bar safe area |
| Progress bar track | Full width, height `4px`, background `rgba(255,255,255,0.2)`, radius `2px` |
| Progress bar fill | `#00754A`, width = `(currentStop / totalStops) * 100%`, animated with `Animated.timing` `300ms` |
| Stop label | `"Parada N de M"`, `13px`, color `rgba(255,255,255,0.7)`, right-aligned |

### Direction row

| Property | Value |
|---|---|
| Layout | `flexDirection: 'row'`, `alignItems: 'flex-start'`, `padding: 16px` |
| MiniMap | Left-aligned, `120x120px`, no additional margin |
| Direction text block | `flex: 1`, `marginLeft: 16px` |
| "Va ate" label | `13px`, color `#8e8e93`, uppercase, `marginBottom: 4px` |
| Shelf name | `18px`, weight `700`, color `rgba(0,0,0,0.87)` |
| Aisle + distance | `13px`, color `#8e8e93`, format: `"[Aisle] · [Xm]"` |

### Collection card

| Property | Value |
|---|---|
| Background | `#ffffff` |
| Margin | `16px` horizontal |
| Padding | `16px` |
| Border radius | `12px` (radiusCard) |
| Shadow | `shadowCard` token |
| "COLETE AGORA" label | `11px`, weight `600`, color `#8e8e93`, letter-spacing `0.08em`, `marginBottom: 8px` |
| Product name | `18px`, weight `700`, color `rgba(0,0,0,0.87)`, `marginBottom: 4px` |
| Brand + shelf sub | `13px`, weight `400`, color `#666666` |

### Primary CTA

| Property | Value |
|---|---|
| Label | `"Marcar como coletado"` (with checkmark prefix) |
| Font size | `16px`, weight `700`, color `#ffffff` |
| Background | `#00754A` |
| Border radius | `50px` |
| Height | `52px` |
| Margin | `16px` horizontal, `16px` top |
| Active scale | `0.95` |
| On press | Mark stop as collected; advance to next stop or show completion state |

### Footer preview

| Property | Value |
|---|---|
| Background | `#f2f0eb` (neutralWarm) |
| Padding | `12px 16px` |
| Text | `"A seguir: [next product name] ([Xm])"` |
| Font size | `13px`, color `#8e8e93` |
| Alignment | Left |
| Visibility | Hidden when on last stop; show `"Ultima parada!"` instead |

### State transitions

| State | Trigger | Behavior |
|---|---|---|
| Navigating | Route active, stop selected | Normal layout as above |
| Collecting | CTA pressed | Button shows `ActivityIndicator` for `300ms`; then advances stop |
| Last stop collected | All items done | CTA label changes to "Compras concluidas"; footer hidden |
| Back navigation | Hardware/gesture back | Confirm dialog: "Cancelar navegacao?" with "Continuar" / "Cancelar rota" |

---

## 6. Map Screen Layout (modified)

**File:** `client/src/pages/MapScreen.tsx` (or equivalent map/wayfinding screen)

### Purpose

The primary wayfinding screen. Phase 7 introduces the split-view layout where the map occupies the upper portion and `PickListPanel` anchors to the bottom when a route is active.

### Layout — Route active

```
+----------------------------------+
|                                  |
|         MapCanvas                |  flex: 1
|         (fills available space)  |
|                                  |
|                          [FAB]   |  <- bottom-right of map area
+----------------------------------+
|                                  |
|         PickListPanel            |  fixed 40% screen height
|         (slide-up from bottom)   |
|                                  |
+----------------------------------+
```

### Layout — No route active

```
+----------------------------------+
|                                  |
|         MapCanvas                |  flex: 1 (fills full screen)
|                                  |
|                          [FAB]   |
+----------------------------------+
```

### MapCanvas container

| Property | Value |
|---|---|
| Flex | `1` |
| Background | `#1E3932` (houseGreen; visible before map loads) |
| Transition | When `PickListPanel` appears, the map container shrinks; use `Animated.Value` on height or rely on flexbox reflow |

### FAB (Floating Action Button — Re-center)

| Property | Value |
|---|---|
| Icon | Location/pin icon (e.g. Ionicons `"locate"`) |
| Size | `48x48px` |
| Background | `#1E3932` (houseGreen) |
| Icon color | `#ffffff` |
| Icon size | `22px` |
| Border radius | `24px` (full circle) |
| Position | `absolute`, `bottom: 16px`, `right: 16px` (relative to map area, above PickListPanel) |
| Shadow | `shadowFrap` token |
| On press | Animate map bearing to `0`, re-center viewport on user position |
| Active scale | `0.95` |
| Z-index | Above MapCanvas, below PickListPanel |

### PickListPanel integration

| Property | Value |
|---|---|
| Height | `40%` screen height (collapsed); `70%` expanded via drag |
| Visibility | Controlled by route store state: `routeStore.isRouteActive` |
| Animation | Slide up from bottom (see PickListPanel spec Section 2) |
| Z-index | Above MapCanvas and FAB |

### Screen-level state management (Zustand slice outline)

```ts
interface MapScreenState {
  isRouteActive: boolean;
  pickList: PickListItemData[];
  currentStopIndex: number;
  bearingDeg: number;
  userPosition: { nodeId: string; x: number; y: number } | null;
  tiltEnabled: boolean;
}
```

- `bearingDeg` updated from device compass sensor at max `60fps`; debounce updates to `16ms` before passing to MapCanvas/MiniMap.
- `tiltEnabled` toggled by a secondary FAB or settings; persisted in `AsyncStorage`.

### Interaction notes

- When `PickListPanel` is expanded to `70%`, the map area is constrained to `30%` of screen height; MapCanvas must remain usable (pinch-to-zoom still active).
- FAB bottom position adjusts when PickListPanel is visible: `bottom = panelHeight + 16px`; use `Animated.Value` tied to panel height.
- Pull-to-dismiss on PickListPanel (drag handle drag below `40%` snap point) sets `isRouteActive = false` after confirmation dialog.

---

## Accessibility

| Component | Requirement |
|---|---|
| Product pins | `accessible={true}` `accessibilityLabel={"Stop [number]: [label]"}` |
| PickListItem active | `accessibilityRole="button"` `accessibilityHint="Swipe left to skip or mark as picked"` |
| PickListItem collected | `accessibilityLabel="[productName], coletado"` |
| MiniMap | `accessible={false}` (decorative; screen readers skip) |
| FAB | `accessibilityLabel="Recentrar mapa"` `accessibilityRole="button"` |
| CTA buttons | `accessibilityRole="button"` on all `Pressable`/`TouchableOpacity` CTAs |

---

## Animation Timing Summary

| Animation | Duration | Easing | Trigger |
|---|---|---|---|
| Route path draw | `600ms` | `ease-in-out` | `routePath` prop change |
| Tilt enable/disable | `600ms` | `Easing.ease` | `tiltEnabled` prop toggle |
| PickListPanel slide-in | Spring `tension 100 friction 12` | Spring | `visible` to `true` |
| PickListPanel slide-out | `300ms` | `Easing.ease` | `visible` to `false` |
| Swipe snap open/close | Spring `tension 150 friction 20` | Spring | PanGestureHandler release |
| Skip button collapse | `400ms` | Linear | Picked tapped |
| Card exit (translateX) | `300ms` | `Easing.ease` | After Skip collapse |
| Card exit (height) | `300ms` | `Easing.ease` | Simultaneous with translateX |
| Progress bar advance | `300ms` | `Easing.ease` | Stop index change |
| User pulse halo | `1200ms` loop | Linear | Component mount |
| FAB bottom adjustment | `300ms` | `Easing.ease` | Panel visibility toggle |

---

## Handoff Notes

**Inputs received:** Phase 7 requirements from task brief; design tokens from `agents/ux_design/design_tokens.json`.

**Decisions made:**
- Route path color `#90d030` chosen to match MappedIn benchmark yellow-green without conflicting with `greenAccent` `#00754A` primary actions.
- Red badge (`#c82014` / `error` token) used for active stop number to create urgency/attention distinction from collected (lime green) and upcoming (gray).
- `PanGestureHandler` (Gesture Handler v2) preferred over `PanResponder` for swipe; falls back to `PanResponder` if Gesture Handler is not installed.
- MiniMap uses `pointerEvents="none"` at the container level — not `<Svg>` level — to prevent React Native's touch system from intercepting parent gestures.
- `PickListPanel` remains mounted (not unmounted) when hidden to avoid FlatList re-mount cost on re-open.

**Artifacts created:** `agents/ux_design/SPECS/CLIENT/phase7-picklist-spec.md`

**Open risks:**
1. `stroke-dashoffset` animation on react-native-svg requires either `react-native-reanimated` SVG plugin or the `Animated` wrapper; confirm which is available in the project before implementing.
2. Panel snap at 70% on small screens (iPhone SE) may leave very little map visible — add minimum map height constraint of `120px`.
3. Gesture Handler swipe may conflict with FlatList vertical scroll; ensure `activeOffsetX` and `failOffsetY` are tuned (`activeOffsetX: [-10, 10]`, `failOffsetY: [-5, 5]`).

**Handoff target:** Client Agent (`client/CLAUDE.md`)

**QA notes for acceptance:**
- Verify z-order: product pins must always render above shelf rects and route path.
- Verify tilt animation runs in exactly `600ms` and does not skip frames on mid-range Android.
- Verify swipe gesture does not trigger on vertical scroll initiation.
- Verify `PickListPanel` FlatList scrolls independently of the panel snap drag.
- Verify MiniMap does not intercept touch events passed to MapCanvas underneath.
