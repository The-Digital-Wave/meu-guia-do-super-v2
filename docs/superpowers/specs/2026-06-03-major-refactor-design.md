# Meu Guia do Super — Major Refactor Design Spec
**Date:** 2026-06-03  
**Status:** Approved  
**Scope:** Full visual + architectural refactor — 16-screen storyboard, Skia map engine, Supermarket model, new design system

---

## 1. Context & Problem Statement

The current codebase has drifted from the intended product design. The existing 4-screen app uses a Starbucks-inspired palette (`#1E3932`) and a basic SVG/RN-canvas map that does not match the approved UX storyboard. This refactor aligns the codebase with the pixel-perfect 16-screen storyboard (`final-version.html`, `ux-handoff.pdf`) and the multi-agent indoor navigation technical spec (`claudecode-agent-specs-for-indoor-navigation.md`).

**Key decisions made during design:**
- Map renderer: `@shopify/react-native-skia` — no Three.js / WebGL / external 3D engine
- 3D axonometric view: manual JS affine projection (pitch 30°, yaw 45°) in `utils/projection.ts`
- Backend: new `Supermarket` model; Layouts become children of Supermarkets
- Onboarding: shown once per install, replayable from settings
- Auth: email/password + guest mode; auth-gated on list save and profile access
- Design system: full replacement of `DESIGN.md` and introduction of `client/src/theme/tokens.ts`
- Store names: generic only (`Supermercado A/B/C`) — app is shown to investors

---

## 2. Delivery Phases

All work is delivered in sequential feature branches. Phases 8a and 8b are independent and can be started in parallel.

| Phase | Branch | Owns | Depends on |
|---|---|---|---|
| 8a | `feature/phase-8a-supermarket-model` | Supermarket DB model, migration, seed, `/supermarkets` API | — |
| 8b | `feature/phase-8b-design-system` | DESIGN.md rewrite, tokens.ts, Skia install, tailwind update | — |
| 8c | `feature/phase-8c-shell-screens` | Splash, Onboarding (4 steps), Auth redesign, AsyncStorage flag | 8b |
| 8d | `feature/phase-8d-store-selection` | Store selection overlay, map loading state, supermarket→layout resolution | 8a + 8c |
| 8e | `feature/phase-8e-search-and-list` | Search/add items redesign, pre-flight picking queue modal | 8d |
| 8f | `feature/phase-8f-skia-map-2d` | Skia canvas, 2D orthographic map, route overlay, aisle callouts | 8e |
| 8g | `feature/phase-8g-nav-3d-and-gestures` | 3D axonometric transition, swipe-to-pick, confirmation overlay, queue succession | 8f |

**Cross-cutting rules (every phase):**
- Every PR must pass `make ci` before merge
- `server/api-spec.md` is updated before any route is implemented (contract-first)
- `client/src/types/index.ts` is updated in the same commit as any shape-changing backend change
- No mock data in production builds — MSW handlers stay isolated

**Files deleted/replaced:**
`app/(app)/index.tsx`, `app/(app)/map.tsx`, `app/(app)/navigation.tsx`, `app/(app)/list.tsx`, `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, all of `components/map/`, all of `components/wayfinding/`, `DESIGN.md` (rewritten).

---

## 3. Phase 8a — Backend: Supermarket Model

### Data model

**New table: `supermarkets`**
```
id           UUID, PK
name         str, not null          e.g. "Supermercado A"
slug         str, unique, not null  e.g. "supermercado-a"
logo_url     str | null
address      str | null
is_active    bool, default true
created_at   datetime
```

**Modified table: `layouts`**
- Adds nullable FK column `supermarket_id → supermarkets.id`
- Nullable for backward-compat; migration backfills demo layout to Supermercado A

### API endpoints (added to `server/api-spec.md`)
```
GET /supermarkets          → list active supermarkets (id, name, slug, logo_url)
GET /supermarkets/:id      → single supermarket with its layouts[]
```

All existing endpoints (`/layouts`, `/shelves`, `/products`, `/navigation`) are unchanged.

### Alembic migration
Single file: create `supermarkets` table → add `layouts.supermarket_id` FK (nullable) → backfill demo layout.

### Seed data
- **Supermercado A** (active, slug: `supermercado-a`) — linked to existing demo layout
- **Supermercado B** (active, slug: `supermercado-b`) — no layout
- **Supermercado C** (active, slug: `supermercado-c`) — no layout
- Product names updated to Brazilian grocery items: *Leite Integral*, *Queijo Mussarela*, *Frango Inteiro*, *Arroz Branco 5kg*, *Feijão Carioca 1kg*, *Azeite Extra Virgem*, *Detergente Líquido*

### Server layers
- `SupermarketController` → validates params, delegates to service
- `SupermarketService` → filters `is_active`, attaches `layouts[]` for single-supermarket endpoint
- `SupermarketRepository` → SQLAlchemy 2.0 async queries

### Tests
- `GET /supermarkets` returns only `is_active=true` records
- `GET /supermarkets/:id` returns 404 on unknown id
- `layouts.supermarket_id` FK integrity enforced

---

## 4. Phase 8b — Design System

### `DESIGN.md` — full replacement
Rewritten to document the new token set, component behavior rules, map canvas color rules, and accessibility minimums. The Starbucks-inspired content is removed entirely.

### `client/src/theme/tokens.ts` — new file (single source of truth)
```ts
export const colors = {
  brandDark:     '#063214',
  brandVibrant:  '#00E676',
  routeActive:   '#4CAF50',
  actionSkip:    '#549A9C',
  actionPick:    '#8BC34A',
  bgLight:       '#F5F5F7',
  white:         '#FFFFFF',
  textPrimary:   '#063214',
  textSecondary: 'rgba(0,0,0,0.58)',
  border:        '#E2E8F0',
  shadow:        'rgba(15,23,42,0.12)',
} as const;

export const typography = {
  fontSans: ['SF Pro Display', 'Roboto', 'sans-serif'],
  h1: { fontSize: 24, fontWeight: '700' },
  h2: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400' },
  meta: { fontSize: 12, fontWeight: '400' },
  mono: { fontFamily: 'monospace' },
} as const;

export const spacing = {
  navBarHeight:   56,
  safeAreaTop:    44,
  safeAreaBottom: 34,
  drawerPeek:     72,
  drawerActive:   340,
  drawerExpanded: 680,
  gutter:         16,
} as const;

export const elevation = {
  drawer: {
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
  },
} as const;
```

### `tailwind.config.js`
Extended with NativeWind class names that mirror token names:
`brand-dark`, `brand-vibrant`, `route-active`, `action-skip`, `action-pick`, `bg-light`.

### Skia dependency
```bash
npx expo install @shopify/react-native-skia
```
Added to `client/package.json`. No other 3D/canvas dependency is introduced.

### Typography
Existing Inter font (already installed via `expo-font`) serves as the Roboto/SF Pro substitute. No new font assets needed.

---

## 5. Phase 8c — Client Shell: Splash, Onboarding, Auth

### Routing structure
```
app/
├── index.tsx                   ← boot router (checks onboarding flag → routes)
├── splash.tsx                  ← Screen 0: logo + spinner, brandDark background
├── onboarding/
│   ├── _layout.tsx             ← stack navigator
│   ├── step1.tsx               ← Spatial Efficiency Focus
│   ├── step2.tsx               ← Instant Search Mapping
│   ├── step3.tsx               ← Route Optimization
│   └── step4.tsx               ← Turn-by-Turn Camera
├── (auth)/
│   ├── _layout.tsx             (kept, restyled)
│   ├── login.tsx               ← rewritten with new tokens
│   └── register.tsx            ← rewritten with new tokens
└── (app)/
    └── settings.tsx            ← NEW: includes "Ver tutorial novamente" row
```

### Boot logic (`app/index.tsx`)
1. Render `splash.tsx` (~2s, logo + spinner on `brandDark` background)
2. Read `AsyncStorage` key `onboarding_complete`
3. Not set → route to `/onboarding/step1`
4. Set → check auth token → route to `/(app)/` or `/(auth)/login`

### Onboarding screens
Each step shares a layout: `brandDark` background, icon card, `brandVibrant` heading, body copy, 4 progress dots, "Avançar" CTA pill, "Pular →" top-right link (skips to `/(auth)/login` on all steps).

On step4 "Começar Agora": sets `AsyncStorage` `onboarding_complete = 'true'` → routes to `/(auth)/login`.

**Replay:** `/(app)/settings.tsx` has a "Ver tutorial novamente" row that clears the flag and routes to `/onboarding/step1`.

### Auth screens (login.tsx)
- Background: `bgLight`
- Logo mark: `brandDark` pill with `brandVibrant` icon
- Email + password fields: white cards, `brandVibrant` focus border
- "ENTRAR" CTA: `brandVibrant` background, `brandDark` text, 50px radius pill
- Google + Facebook: white outlined buttons, show "Em breve" toast on press
- "Entrar como convidado" text link: sets `isGuest = true` in `useAuthStore`, routes to `/(app)/`

### Guest auth-gate rules
- `/(app)/list` with `isGuest === true` → shows `AuthGateSheet` bottom sheet with "Criar conta" / "Entrar" / "Continuar sem salvar" options
- "Continuar sem salvar" → opens list in ephemeral mode (list clears on app close)
- `/(app)/settings` profile tab with `isGuest === true` → same `AuthGateSheet`

### `useAuthStore` changes
Adds `isGuest: boolean` field. Guest login sets `isGuest = true`, `user = null`.

---

## 6. Phase 8d — Store Selection + Map Loading

### New screens
```
app/(app)/
├── index.tsx          ← REWRITTEN: two render states (no store / store loaded)
├── store-select.tsx   ← NEW: supermarket dropdown modal
└── store-loading.tsx  ← NEW: asset parsing loader
```

### Screen flow
```
/(app)/index (no store) → store-select.tsx → store-loading.tsx → /(app)/index (map populated)
```

### `/(app)/index.tsx` — two states
**No store selected:** dot-grid background, empty-state icon, disabled cart FAB (badge: 0).  
**Store loaded:** Skia map canvas (placeholder until 8f), search bar in nav, active cart FAB.

### `store-select.tsx`
- Expo Router modal presentation (slides up over index)
- Queries `GET /supermarkets` via `useSupermarkets` hook
- Supermercado A row: active, tappable — routes to `store-loading.tsx?supermarketId=<id>`
- Supermercado B + C rows: `opacity: 0.7`, disabled (no layout assigned)

### `store-loading.tsx`
- Full-screen `brandDark` background, pulsing yellow `#FFEB3B` "Carregando..." badge
- Triggers `GET /layouts?supermarket_id=<id>` → `GET /layouts/:id/download`
- On success: stores bundle in `useNavigationStore` → replaces route with `/(app)/index`
- On error: error banner with retry button

### Zustand store additions
```ts
// useNavigationStore
activeSupermarketId: string | null
activeSupermarketName: string | null
setActiveSupermarket(id: string, name: string): void
```

### New hook + type
```ts
// client/src/hooks/useSupermarkets.ts
export function useSupermarkets() {
  return useQuery({ queryKey: ['supermarkets'], queryFn: api.getSupermarkets })
}

// client/src/types/index.ts addition
export interface Supermarket {
  id: string
  name: string
  slug: string
  logo_url: string | null
  is_active: boolean
}
```

---

## 7. Phase 8e — Search + Pre-flight List Modal

### Search (in-place on index.tsx)
- Search bar embedded in nav bar (right of store picker), expands on focus
- Dropdown results overlay (`z: 30`) appears for `query.length >= 1`
- `FlatList` rows: product name + "Adicionar ＋" right action
- Tapping row: adds to `useGroceryListStore`, increments cart FAB badge, collapses dropdown
- No route push — entirely in-place

### Cart FAB
- Bottom-right, `brandDark` background, `brandVibrant` badge with count
- `Animated.spring` bounce on each new item add
- Guest + `isGuest === true` → tap shows `AuthGateSheet` instead of list

### `list.tsx` — Pre-flight Picking Queue Modal
Expo Router modal. Layout:
- Handle bar (48px, centred)
- Header: "Lista de Compras" + item count badge
- `FlatList` of rows: emoji/image | name | quantity stepper `‹ n ›` | `×` delete
- Rows reorderable via long-press drag (`react-native-reorderable-list`)
- "Iniciar navegação →" CTA pill (`emerald-700`): disabled when list empty; on press calls `POST /navigation/route` → routes to `/(app)/map`

### `useGroceryListStore` additions
```ts
isEphemeral: boolean  // true when guest bypasses auth gate — list not persisted
```

### New MSW handlers
- `GET /supermarkets` → 3 generic supermarket fixtures
- `GET /products?q=*` → filtered Brazilian grocery product fixtures

---

## 8. Phase 8f — Skia 2D Map Canvas

### New files
```
client/src/
├── components/map/
│   ├── SkiaMapCanvas.tsx       ← replaces MapCanvas.tsx
│   ├── RouteOverlay.tsx        ← rewritten: Skia Path instead of SVG
│   ├── AisleCallout.tsx        ← new: Skia rect + text callout badge
│   └── WaypointBadge.tsx       ← new: Skia numbered circle pin
└── utils/
    ├── projection.ts           ← new: toScreen2D + toScreen3D affine helpers
    └── skiaHelpers.ts          ← new: reusable Skia paint factories
```

### `projection.ts`
```ts
// 2D: direct scale + translate
export function toScreen2D(x, y, layoutW, layoutH, canvasW, canvasH, pan, zoom): {sx, sy}

// 3D: pitch 30°, yaw 45° parallel affine projection
// u = K · (cos45°·(X−Xu) − cos45°·(Y−Yu))
// v = K · (sin45°·sin30°·(X−Xu) + sin45°·sin30°·(Y−Yu) − cos30°·Z)
// Z = 0 for floor-plane coordinates
export function toScreen3D(x, y, userX, userY, canvasW, canvasH, zoom): {sx, sy}
```

### `SkiaMapCanvas.tsx` props
```ts
bundle: LayoutBundle
route: RouteResponse | null
mode: '2d' | '3d'
userPos: { x: number; y: number } | null
```

### Skia layer render order (back → front)
1. Floor fill (`bgLight #F5F5F7`) + optional dot grid
2. Shelf rects (fill from `shelf.color`, `border` stroke)
3. Aisle label text at shelf centroids
4. Route path (`routeActive #4CAF50`, strokeWidth 4, dashed in 2D)
5. Waypoint badges (Circle + Text number)
6. User dot (Circle, `#3B82F6`, white stroke, radius 6)

### Gesture handling
`PanGestureHandler` wraps `<Canvas>`:
- One-finger pan → updates `pan` shared value (Reanimated)
- Two-finger pinch → updates `zoom` shared value (clamped 0.5–4.0)
- `runOnJS` keeps Skia redraws on the UI thread

### `map.tsx` (Screen 12 — 2D overview)
- Top nav: `← Voltar` | `VISÃO DA ROTA` | avatar
- Body: `SkiaMapCanvas mode='2d'`, full flex
- Compass rose: absolute bottom-right
- Bottom drawer (peek 72px): list label + metrics + two CTAs:
  - **"Iniciar" (`#9CCC65`)** → triggers 8g transition
  - **"Ver itens" (`#549A9C`)** → expands drawer

---

## 9. Phase 8g — 3D Axonometric Transition + Swipe Gestures + Queue Succession

### New files
```
client/src/components/map/
├── SwipeableItemCard.tsx       ← horizontal swipe-to-pick/skip row
└── ConfirmationOverlay.tsx     ← 400ms full-row success flash
app/(app)/
└── navigation.tsx              ← rewritten: 5-state navigation machine
```

### 2D → 3D camera transition (1200ms)
Split into two 600ms stages driven by a single Reanimated `transitionProgress: 0→1`:
- **0–600ms:** Zoom interpolation to `targetZoom = 2.5`, `cubic-bezier(0.25, 0.1, 0.25, 1.0)`
- **600–1200ms:** `SkiaMapCanvas` switches `mode` from `'2d'` to `'3d'`; all coordinates route through `toScreen3D`; camera pan offset lerps toward active waypoint

### Navigation state machine
```
GUIDANCE_ACTIVE → (swipe ≥ 64px left) → SWIPE_REVEALED
SWIPE_REVEALED  → (tap "Pular")        → QUEUE_ADVANCING
SWIPE_REVEALED  → (tap "COLETADO →")  → CONFIRMING
CONFIRMING      → (400ms elapsed)      → QUEUE_ADVANCING
QUEUE_ADVANCING → (next item exists)   → GUIDANCE_ACTIVE
QUEUE_ADVANCING → (queue empty)        → TRIP_COMPLETE
```

State stored in `useNavigationStore` as `navState: NavState`.

### `SwipeableItemCard.tsx`
- `PanGestureHandler` on X axis
- `|ΔX| < 64px` → follows finger, `withSpring` snap-back on release
- `ΔX ≥ 64px` leftward → locks at −160px → state → `SWIPE_REVEALED`
- Revealed buttons (fill space behind card):
  - Left 50%: **"Pular"** (`actionSkip #549A9C`)
  - Right 50%: **"COLETADO →"** (`actionPick #8BC34A`)

### `ConfirmationOverlay.tsx`
- Active card expands to 100% row width, fills `actionPick (#8BC34A)`
- Animated checkmark + "COLETADO !" text centred
- Map canvas frozen (`pointerEvents='none'`)
- After 400ms: state → `QUEUE_ADVANCING`

### Queue succession
1. Remove item from `useGroceryListStore`
2. Next item becomes active in drawer
3. Camera pan: `Pcam(t) = (1−τ)·P_item1 + τ·P_item2` where τ = `CubicBezier(0.25,0.1,0.25,1.0)` over 800ms
4. `SkiaMapCanvas` re-renders with new active waypoint
5. State → `GUIDANCE_ACTIVE`

Queue empty → `TRIP_COMPLETE`: full-screen celebration, "Ver resumo" CTA routes to `/(app)/index`.

### Tests
- State machine transitions (all 6 paths above)
- `ConfirmationOverlay` unmounts after exactly 400ms
- Queue emptying triggers `TRIP_COMPLETE`
- `toScreen3D`: known input coordinates produce expected pixel outputs (unit test)

---

## 10. Files Changed Summary

### Deleted / fully replaced (client)
- `app/(app)/index.tsx` → rewritten Phase 8d
- `app/(app)/list.tsx` → rewritten Phase 8e
- `app/(app)/map.tsx` → rewritten Phase 8f
- `app/(app)/navigation.tsx` → rewritten Phase 8g
- `app/(auth)/login.tsx` → rewritten Phase 8c
- `app/(auth)/register.tsx` → rewritten Phase 8c
- `components/map/MapCanvas.tsx` → replaced by `SkiaMapCanvas.tsx` Phase 8f
- `components/map/MiniMap.tsx` → removed (absorbed into `SkiaMapCanvas`)
- `components/map/PickListItem.tsx` → replaced by `SwipeableItemCard.tsx` Phase 8g
- `components/map/PickListPanel.tsx` → replaced by `list.tsx` modal Phase 8e
- `components/map/RouteOverlay.tsx` → rewritten as Skia Phase 8f
- `components/wayfinding/` (all 4 files) → replaced by Phase 8f/8g components
- `DESIGN.md` → rewritten Phase 8b

### Deleted / fully replaced (server)
- `server/src/models/supermarket.py` → new Phase 8a
- `server/src/controllers/supermarket.py` → new Phase 8a
- `server/src/services/supermarket.py` → new Phase 8a (actually new files)
- `server/src/repositories/supermarket.py` → new Phase 8a
- `server/src/routers/supermarkets.py` → new Phase 8a
- `server/api-spec.md` → updated Phase 8a (supermarkets section added)

### New files (client)
- `app/index.tsx` (boot router)
- `app/splash.tsx`
- `app/onboarding/_layout.tsx`, `step1–4.tsx`
- `app/(app)/store-select.tsx`
- `app/(app)/store-loading.tsx`
- `app/(app)/settings.tsx`
- `client/src/theme/tokens.ts`
- `client/src/hooks/useSupermarkets.ts`
- `client/src/utils/projection.ts`
- `client/src/utils/skiaHelpers.ts`
- `client/src/components/map/SkiaMapCanvas.tsx`
- `client/src/components/map/AisleCallout.tsx`
- `client/src/components/map/WaypointBadge.tsx`
- `client/src/components/map/SwipeableItemCard.tsx`
- `client/src/components/map/ConfirmationOverlay.tsx`

---

## 11. Definition of Done (Cross-Phase)

A phase is complete when:
1. `make ci` passes (ruff + mypy + pytest + tsc + eslint --max-warnings 0)
2. All new screens render without errors on Expo Go (iPhone, same WiFi)
3. MSW handlers cover all new API calls
4. `server/api-spec.md` and `client/src/types/index.ts` are in sync
5. PR reviewed and merged to `master` before next phase branch is cut
