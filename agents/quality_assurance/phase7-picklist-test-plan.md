# Phase 7 — Pick&Pack Visual Parity Refactor: Test Plan

**Agent:** Quality Assurance  
**Feature branch:** `worktree-feature+phase-7-picklist`  
**Date:** 2026-06-01  
**Coverage target:** All Phase 7 deliverables — MapCanvas, PickListPanel, PickListItem, MiniMap, map.tsx, navigation.tsx, server enriched segments, and regressions.

---

## Scope

| Surface | Included |
|---|---|
| `client/src/components/map/MapCanvas.tsx` | Yes |
| `client/src/components/map/PickListPanel.tsx` | Yes |
| `client/src/components/map/PickListItem.tsx` | Yes |
| `client/src/components/map/MiniMap.tsx` | Yes |
| `client/app/(app)/map.tsx` | Yes |
| `client/app/(app)/navigation.tsx` | Yes |
| `server/src/services/navigation_service.py` | Yes |
| `client/src/types/index.ts` — RouteSegment enriched fields | Yes |
| `client/src/mocks/handlers.ts` | Yes |
| Auth flow, product search, grocery-list optimize | Regression only |

---

## 1. MapCanvas — Shelf Rendering

### TC-1.1 Shelf blocks are rendered for each layout shelf

**Arrange:**
- Mount `<MapCanvas>` with a `LayoutBundle` containing 3 shelves, each with valid `x`, `y`, `width`, `height`, and `color` properties.
- No route or product pins are supplied.

**Act:**
- Query the rendered SVG for `<Rect>` elements with a `data-testid="shelf-rect"` (or by ARIA role / native `rect` element).

**Assert:**
- Exactly 3 `Rect` elements are present in the SVG.
- Each `Rect` has `fillOpacity={0.3}` (or equivalent `fill-opacity: 0.3` style value).
- Each `Rect` has `strokeOpacity={1}` (or `stroke-opacity: 1`).
- Each `Rect` `fill` and `stroke` values match the corresponding shelf `color` property.

---

### TC-1.2 Shelf blocks respect x/y/width/height coordinates

**Arrange:**
- Single shelf: `{ x: 10, y: 20, width: 50, height: 30, color: "#4A90D9" }`.

**Act:**
- Read rendered `Rect` attributes.

**Assert:**
- `x="10"`, `y="20"`, `width="50"`, `height="30"`.

---

### TC-1.3 Empty LayoutBundle renders no shelf blocks

**Arrange:**
- `LayoutBundle.shelves = []`.

**Act:**
- Query SVG for `Rect` elements with shelf test IDs.

**Assert:**
- Zero shelf `Rect` elements are present; no error is thrown.

---

## 2. MapCanvas — Product Pin Rendering

### TC-2.1 Correct count of numbered circles for product pins

**Arrange:**
- Mount `<MapCanvas>` with `productPins` array containing 3 entries:
  ```json
  [
    { "id": "p1", "x": 10, "y": 15, "label": "1" },
    { "id": "p2", "x": 30, "y": 40, "label": "2" },
    { "id": "p3", "x": 60, "y": 25, "label": "3" }
  ]
  ```

**Act:**
- Query the SVG for pin circle elements (e.g., `data-testid="product-pin"`).

**Assert:**
- Exactly 3 pin circles are rendered.
- Each circle displays its sequential label ("1", "2", "3") inside it.

---

### TC-2.2 Product pins are rendered above intersection nodes in z-order

**Arrange:**
- Same 3-pin setup as TC-2.1; route nodes are also present.

**Act:**
- Inspect the SVG DOM order (later siblings paint on top in SVG).

**Assert:**
- All `product-pin` elements appear after (i.e., later in DOM order than) the intersection-node elements, ensuring pins are not occluded.

---

### TC-2.3 Empty productPins renders no circles

**Arrange:**
- `productPins = []`.

**Act:**
- Query for pin circles.

**Assert:**
- Zero pin elements; no error thrown.

---

## 3. MapCanvas — Bearing Rotation

### TC-3.1 SVG G element applies rotate transform for non-zero bearing

**Arrange:**
- Mount `<MapCanvas>` with `bearingDeg={45}`.
- Map centre is at `(cx, cy)`.

**Act:**
- Read the `transform` attribute of the outermost SVG `<G>` (group) element.

**Assert:**
- Transform string contains `rotate(-45, ${cx}, ${cy})` (bearing is negated so the map rotates to face travel direction).

---

### TC-3.2 Zero bearing applies no rotation transform

**Arrange:**
- `bearingDeg={0}`.

**Act:**
- Read the `<G>` element transform.

**Assert:**
- Transform is `rotate(0, cx, cy)` or is absent / identity — no visible rotation.

---

### TC-3.3 Bearing animation duration is 600 ms

**Arrange:**
- Mount with `bearingDeg={0}`.
- Use `jest.useFakeTimers()` (or React Native `Animated` mock that records duration).

**Act:**
- Update prop to `bearingDeg={90}`.

**Assert:**
- The animation is configured with `duration: 600` (ms).
- Before 600 ms has elapsed, the rendered transform has not yet reached `rotate(-90, cx, cy)`.
- At/after 600 ms, the transform equals `rotate(-90, cx, cy)`.

---

### TC-3.4 Rapid bearing updates do not cause transform to jump (debounce / interpolation)

**Arrange:**
- `bearingDeg={0}` → `{45}` → immediately `{90}`.

**Act:**
- Advance timers by 300 ms.

**Assert:**
- The rendered transform reflects an intermediate value (not the final `rotate(-90)`) — confirming the animation interpolates rather than snapping.

---

## 4. PickListPanel — Ordering

### TC-4.1 FlatList data order: collected → active → upcoming

**Arrange:**
- `segments = [segA, segB, segC]`
- `activeIndex = 1` (segB is active)
- `collectedIndices = [0]` (segA is collected)

**Act:**
- Render `<PickListPanel>` and inspect the `data` prop passed to the inner `FlatList` (or the rendered item order).

**Assert:**
- Item order in the list is: `[segA (collected), segB (active), segC (upcoming)]`.
- segA renders with a collected visual state.
- segB renders with an active visual state.
- segC renders with an upcoming visual state.

---

### TC-4.2 All segments upcoming when activeIndex=0 and no collected items

**Arrange:**
- `segments = [segA, segB, segC]`, `activeIndex = 0`, `collectedIndices = []`.

**Act:**
- Render and inspect item order.

**Assert:**
- Order is `[segA (active), segB (upcoming), segC (upcoming)]`.

---

### TC-4.3 All segments collected when all indices are in collectedIndices

**Arrange:**
- `segments = [segA, segB]`, `collectedIndices = [0, 1]`, `activeIndex = 2` (out of range).

**Act:**
- Render and inspect.

**Assert:**
- Both items render as collected; list is not empty and no error is thrown.

---

## 5. PickListItem — Swipe Gesture States

### TC-5.1 Active item shows red badge and green left border

**Arrange:**
- Render `<PickListItem>` with `state="active"`.

**Act:**
- Query the component tree for the badge element and the left border style.

**Assert:**
- A red badge element is visible (non-zero size, red background color token).
- The item container has a left border with a green color token applied.

---

### TC-5.2 Swipe-left ≥40px reveals Skip and Picked action buttons

**Arrange:**
- Render an active `<PickListItem>`.
- Use `fireEvent` / gesture-event simulation to move the pan by `dx = -40`.

**Act:**
- Query for "Skip" and "Picked" button labels.

**Assert:**
- Both "Skip" and "Picked" buttons are visible in the rendered output.

---

### TC-5.3 Swipe-left <40px does not reveal action buttons

**Arrange:**
- Render an active `<PickListItem>`.
- Simulate pan by `dx = -20` (below threshold).

**Act:**
- Query for action buttons.

**Assert:**
- Neither "Skip" nor "Picked" buttons are visible.

---

### TC-5.4 Tapping Picked expands, then fires onCollect after 400 ms

**Arrange:**
- Render with `state="active"` and a mock `onCollect` callback.
- Swipe left ≥40px to reveal buttons.

**Act:**
- Tap the "Picked" button.
- Advance timers by 399 ms.

**Assert (intermediate):**
- `onCollect` has NOT been called yet; a visual expansion/confirmation state is visible.

**Act (continue):**
- Advance timers by 1 more ms (total 400 ms).

**Assert (final):**
- `onCollect` has been called exactly once.

---

### TC-5.5 Collected item shows green checkmark, strikethrough text, and no swipe interaction

**Arrange:**
- Render `<PickListItem>` with `state="collected"`.

**Act:**
- Query for checkmark icon, label text style, and attempt gesture simulation.

**Assert:**
- A green checkmark icon is visible.
- The item label has a strikethrough text decoration.
- Swipe gesture does not reveal action buttons (swipe handler is absent or disabled).

---

### TC-5.6 Tapping Skip fires onSkip callback

**Arrange:**
- Render with `state="active"`, mock `onSkip` callback.
- Swipe left ≥40px.

**Act:**
- Tap "Skip".

**Assert:**
- `onSkip` is called exactly once immediately (no delay).

---

## 6. map.tsx — Bearing Computation

### TC-6.1 Bearing is computed correctly from userNode and shelf_front coordinates

**Arrange:**
- `userNode = { x: 5, y: 28.5 }`
- Active segment `shelf_front_x = 20`, `shelf_front_y = 21`
- `dx = 20 - 5 = 15`, `dy = 21 - 28.5 = -7.5`

**Act:**
- Invoke the bearing `useMemo` (or the standalone helper) with these coordinates.

**Assert:**
- `bearingDeg ≈ atan2(15, -7.5) × (180 / π)`  
  = `atan2(15, -7.5)` ≈ `2.034 rad` ≈ `116.6°`  
  *(Note: if the implementation uses `atan2(dy, dx)` geographic convention, expected value ≈ 63.4°; verify formula against implementation and lock the assertion to that value.)*
- Result is a finite number (not `NaN` or `Infinity`).

---

### TC-6.2 Bearing defaults to 0 when shelf_front fields are null

**Arrange:**
- Active segment has `shelf_front_x = null`, `shelf_front_y = null`.

**Act:**
- Compute bearing.

**Assert:**
- `bearingDeg === 0`.

---

### TC-6.3 Bearing defaults to 0 when userNode is absent

**Arrange:**
- `userNode = null`.

**Act:**
- Compute bearing.

**Assert:**
- `bearingDeg === 0`; no error thrown.

---

## 7. map.tsx — Store-Bearing Sync to navigation.tsx

### TC-7.1 setBearing called in useEffect whenever bearingDeg changes

**Arrange:**
- Mock Zustand bearing store with a `setBearing` spy.
- Mount `map.tsx` with initial bearing `0`.

**Act:**
- Update the active segment so bearing recomputes to `63.4`.

**Assert:**
- `setBearing` is called with `63.4` (within floating-point tolerance ±0.1°).

---

### TC-7.2 setBearing not called when bearing value is unchanged

**Arrange:**
- Initial bearing already resolves to `63.4`.

**Act:**
- Re-render with identical segment data (no coordinate change).

**Assert:**
- `setBearing` is NOT called a second time (useEffect dependency array is correct).

---

### TC-7.3 MiniMap in navigation.tsx reflects the store bearing value

**Arrange:**
- Set store bearing to `90` via `setBearing`.
- Render `<NavigationScreen>` which mounts `<MiniMap>`.

**Act:**
- Query `MiniMap`'s `bearingDeg` prop.

**Assert:**
- `MiniMap` receives `bearingDeg={90}`.

---

## 8. Server — Enriched Route Segments

### TC-8.1 POST /navigation/route returns enriched fields when product has a shelf with shelf_front node

**Arrange:**
- Seed DB with:
  - A product with `shelf_id` pointing to a shelf.
  - That shelf has a `shelf_front_node` with `x` and `y` coordinates.
- Prepare a valid `POST /navigation/route` request body referencing this product.

**Act:**
```http
POST /api/v1/navigation/route
Content-Type: application/json

{ "product_ids": ["<product_id>"], "start_node_id": "<entrance_node_id>" }
```

**Assert:**
- HTTP status `200`.
- Response body `segments` array contains at least one segment where:
  - `product_name` equals the seeded product name (non-null string).
  - `shelf_label` equals the seeded shelf label (non-null string).
  - `shelf_front_x` is a number matching the shelf_front node `x`.
  - `shelf_front_y` is a number matching the shelf_front node `y`.

---

### TC-8.2 POST /navigation/route returns null enriched fields when product has no shelf assignment

**Arrange:**
- Seed DB with a product that has `shelf_id = null`.
- Prepare a valid route request referencing this product.

**Act:**
```http
POST /api/v1/navigation/route
Content-Type: application/json

{ "product_ids": ["<unassigned_product_id>"], "start_node_id": "<entrance_node_id>" }
```

**Assert:**
- HTTP status `200` (not an error).
- The corresponding segment has `shelf_label = null`, `shelf_front_x = null`, `shelf_front_y = null`.
- `product_name` is still populated (product exists even without a shelf).

---

### TC-8.3 Enriched fields are absent from non-product waypoint segments

**Arrange:**
- Route includes a waypoint node that is not a product stop (e.g., a turn/junction).

**Act:**
- Inspect that segment in the response.

**Assert:**
- `product_name`, `shelf_label`, `shelf_front_x`, `shelf_front_y` are all `null` or absent.
- Segment is otherwise valid (has `node_id`, `instruction`).

---

### TC-8.4 RouteSegment schema in client types includes the 5 enriched optional fields

**Arrange:**
- Open `client/src/types/index.ts`.

**Assert (static):**
- `RouteSegment` interface declares:
  - `product_name?: string | null`
  - `shelf_label?: string | null`
  - `shelf_front_x?: number | null`
  - `shelf_front_y?: number | null`
  - (1 additional enriched field per spec)
- TypeScript compilation (`tsc --noEmit`) passes with zero errors.

---

### TC-8.5 MSW mock handler includes enriched fields matching schema

**Arrange:**
- Review `client/src/mocks/handlers.ts` POST `/navigation/route` handler.

**Assert (static / unit):**
- The mock response segment objects include all 5 enriched fields.
- Field types match `RouteSegment` interface (no TS errors).

---

## 9. Regression — Existing Server Tests

### TC-9.1 All 37 existing pytest tests pass after server changes

**Arrange:**
- Clean test database / test fixtures identical to pre-Phase-7 state.

**Act:**
```bash
cd server
python -m pytest --tb=short -q
```

**Assert:**
- Output shows `37 passed, 0 failed, 0 errors`.
- No warnings are elevated to errors by `filterwarnings` configuration.

---

### TC-9.2 navigation_service unit tests pass with enriched return values

**Arrange:**
- Any existing unit tests for `navigation_service.py` run as-is.

**Act:**
- Run `python -m pytest tests/test_navigation_service.py -v` (or equivalent).

**Assert:**
- All previously passing assertions still pass.
- New enriched fields do not break existing assertions (they are additive).

---

## 10. Regression — Existing Client Flows

### TC-10.1 Login flow is unaffected

**Arrange:**
- Use MSW mock; start at login screen with valid credentials.

**Act:**
- Submit login form.

**Assert:**
- Auth store receives JWT and user object.
- App navigates to home screen (no crash, no blank screen).

---

### TC-10.2 Register flow is unaffected

**Arrange:**
- MSW mock returns success for POST /auth/register.

**Act:**
- Fill registration form and submit.

**Assert:**
- Success message displayed; user is redirected to login or home.
- No TypeScript type errors introduced by Phase 7 changes.

---

### TC-10.3 Product search returns results correctly

**Arrange:**
- MSW mock returns a paginated envelope `{ items: [...], total: 5, page: 1, size: 20 }`.
- Navigate to product search screen.

**Act:**
- Enter a search query.

**Assert:**
- Results list renders the mocked items.
- Loading, empty, and error states are reachable without crash.

---

### TC-10.4 Grocery list optimize reorders items

**Arrange:**
- MSW mock returns a reordered list for the optimize endpoint.
- Open grocery list with 3 unordered items.

**Act:**
- Tap the "Optimize" / "Get Route" action.

**Assert:**
- List reorders to the server-returned order.
- No crash; no stale UI state from prior Phase 7 changes.

---

### TC-10.5 Frontend TypeScript compilation passes with zero errors

**Act:**
```bash
cd client
npx tsc --noEmit
```

**Assert:**
- Exit code `0`.
- Zero TypeScript errors printed to stdout.

---

### TC-10.6 Frontend ESLint passes with zero warnings

**Act:**
```bash
cd client
npx eslint src --max-warnings 0
```

**Assert:**
- Exit code `0`.
- No ESLint warnings or errors.

---

## Manual Smoke Test — Expo Go on Device (Full Pick&Pack User Flow)

Run this checklist on a physical iPhone with the Expo Go app, connected to the local dev server (`uvicorn src.main:app --reload`) via `EXPO_PUBLIC_API_URL`.

### Pre-conditions
- [ ] iPhone and dev PC are on the same WiFi network.
- [ ] `cd server && uvicorn src.main:app --reload` is running with no startup errors.
- [ ] `cd client && npx expo start` displays a QR code.
- [ ] Expo Go on iPhone scans the QR code and app loads to the home/login screen.

### Authentication
- [ ] Login screen renders with correct Starbucks-inspired color tokens (green CTA, warm neutral background).
- [ ] Valid credentials log in successfully and navigate to home.
- [ ] Invalid credentials show an error message without crash.

### Product Search
- [ ] Search bar is reachable from home.
- [ ] Typing a product name returns a filtered list.
- [ ] Tapping a product opens its detail view.

### Building a Pick List
- [ ] Add at least 3 products from different shelf zones to the grocery list.
- [ ] "Optimize Route" button is visible on the grocery list screen.
- [ ] Tapping "Optimize Route" calls the server and reorders items (spinner visible during load).
- [ ] Reordered list displays with numbered stops.

### Entering Navigation / map.tsx
- [ ] Tapping "Start Navigation" / "Navigate" opens the map screen.
- [ ] MapCanvas renders shelf blocks with semi-transparent fills.
- [ ] Product pins (numbered circles) appear at the correct shelf positions.
- [ ] The map is oriented so the user's travel direction faces up (bearing rotation applied).
- [ ] PickListPanel is visible as a bottom sheet.
- [ ] PickListPanel shows stops in correct order: active stop highlighted, upcoming stops dimmed.

### Swipe Gesture — PickListItem
- [ ] Swiping left on the active PickListItem reveals "Skip" and "Picked" action buttons.
- [ ] Tapping "Picked" triggers a visual expansion/confirmation, then item moves to collected state (green checkmark, strikethrough text) after ~400 ms.
- [ ] Tapping "Skip" immediately moves to the next stop without collected styling.
- [ ] Collected items are not swipeable.

### Bearing / Compass Sync
- [ ] As the active stop changes, the map rotates smoothly (600 ms animation) to face the new travel direction.
- [ ] Rotation is not jarring or instant.

### navigation.tsx — MiniMap and Product Card
- [ ] Navigation screen shows a 120×120 MiniMap in a corner.
- [ ] MiniMap reflects the same bearing as the main map.
- [ ] Product card below/above MiniMap shows the current stop's product name and shelf label.
- [ ] Product card updates when the active stop advances.

### Completion
- [ ] After all stops are collected/skipped, the panel shows an "All Done" or empty state.
- [ ] No crash occurs at journey completion.
- [ ] Returning to grocery list screen reflects the completed/skipped states.

### Offline Behavior
- [ ] Disable WiFi on iPhone after navigation starts.
- [ ] Map and current route remain visible (cached / in-memory state).
- [ ] An appropriate offline indicator is shown.
- [ ] Re-enabling WiFi resumes normal operation without requiring a full restart.

---

## Test Execution Sign-Off

| Test Group | Owner | Status | Notes |
|---|---|---|---|
| 1. MapCanvas shelf rendering | QA | Pending | |
| 2. MapCanvas product pins | QA | Pending | |
| 3. MapCanvas bearing rotation | QA | Pending | |
| 4. PickListPanel ordering | QA | Pending | |
| 5. PickListItem swipe states | QA | Pending | |
| 6. map.tsx bearing computation | QA | Pending | |
| 7. map.tsx bearing sync | QA | Pending | |
| 8. Server enriched segments | QA | Pending | |
| 9. Server regression | QA | Pending | |
| 10. Client regression | QA | Pending | |
| Manual smoke test | QA + Dev | Pending | Requires physical device |

---

## Handoff

**Inputs received:** Phase 7 implementation deliverables (MapCanvas, PickListPanel, PickListItem, MiniMap, map.tsx, navigation.tsx, navigation_service.py, types/index.ts, mocks/handlers.ts).

**Decisions made:**
- All test cases use Arrange-Act-Assert format per QA agent convention.
- Bearing formula assertion is flagged with a note to verify against actual implementation convention (`atan2(dy, dx)` vs geographic `atan2(dx, dy)`) and lock to whichever the code uses.
- Server tests assert count of 37 to match the pre-Phase-7 baseline per spec.

**Artifacts created:**
- `agents/quality_assurance/phase7-picklist-test-plan.md` (this file)

**Open risks and assumptions:**
1. Bearing formula direction (geographic vs screen axes) must be confirmed against `map.tsx` implementation before TC-6.1 is automated.
2. Swipe gesture threshold (40 px) and Picked animation delay (400 ms) are taken from the task spec; if constants are configurable, test values should bind to the exported constant rather than hard-coded numbers.
3. The `37 passed` count in TC-9.1 assumes no new server tests were added in Phase 7 beyond the ones described. If new tests exist, update the count.
4. Manual smoke test requires a seeded database with real shelf/product data — confirm seed script (`scripts/seed.py` or equivalent) is up to date.

**Explicit handoff target:** DevSecOps Agent — all automated test groups must pass in CI before merge to `master`. Manual smoke test sign-off required from a developer with a physical device before release.
