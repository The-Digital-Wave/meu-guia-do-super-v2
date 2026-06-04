# Phase 8b — Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Starbucks-inspired design system with the new storyboard token set, create `client/src/theme/tokens.ts` as the single source of truth, update NativeWind/Tailwind config to match, install `@shopify/react-native-skia`, and rewrite `DESIGN.md`.

**Architecture:** `tokens.ts` exports typed constants consumed by all components. NativeWind class names in `tailwind.config.js` mirror the token names so both inline-style and utility-class approaches stay in sync.

**Tech Stack:** TypeScript, NativeWind (Tailwind CSS for RN), `@shopify/react-native-skia`, Expo SDK

**Branch:** `feature/phase-8b-design-system` (cut from `master`, parallel to 8a)

---

## File Map

| Action | Path |
|--------|------|
| Create | `client/src/theme/tokens.ts` |
| Modify | `client/tailwind.config.js` |
| Modify | `client/package.json` (via `npx expo install`) |
| Rewrite | `DESIGN.md` |

---

## Task 1: Create `tokens.ts`

**Files:**
- Create: `client/src/theme/tokens.ts`

- [ ] **Step 1: Create the file**

```typescript
// client/src/theme/tokens.ts
export const colors = {
  // Brand
  brandDark:    '#063214',
  brandVibrant: '#00E676',
  // Functional
  routeActive:  '#4CAF50',
  actionSkip:   '#549A9C',
  actionPick:   '#8BC34A',
  // Neutral
  bgLight:      '#F5F5F7',
  white:        '#FFFFFF',
  // Text
  textPrimary:  '#063214',
  textSecondary:'rgba(0,0,0,0.58)',
  textMeta:     'rgba(0,0,0,0.40)',
  // UI structural
  border:       '#E2E8F0',
  shadow:       'rgba(15,23,42,0.12)',
  // Map-specific
  userDot:      '#3B82F6',
  waypointTarget:'#EF4444',
  loadingYellow:'#FFEB3B',
} as const;

export const typography = {
  fontSans:   ['SF Pro Display', 'Inter_400Regular', 'sans-serif'] as const,
  fontBold:   ['SF Pro Display', 'Inter_600SemiBold', 'sans-serif'] as const,
  fontMono:   ['Courier New', 'monospace'] as const,
  h1: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.3 },
  body: { fontSize: 14, fontWeight: '400' as const },
  meta: { fontSize: 12, fontWeight: '400' as const },
  badge: { fontSize: 10, fontWeight: '700' as const },
} as const;

export const spacing = {
  navBarHeight:    56,
  safeAreaTop:     44,
  safeAreaBottom:  34,
  drawerPeek:      72,
  drawerActive:    340,
  drawerExpanded:  680,
  gutter:          16,
  cardRadius:      12,
  pillRadius:      50,
  badgeRadius:     6,
} as const;

export const elevation = {
  drawer: {
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: -4 } as const,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: 'rgba(15,23,42,0.12)',
    shadowOffset: { width: 0, height: 4 } as const,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export type ColorKey = keyof typeof colors;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors relating to `tokens.ts`.

- [ ] **Step 3: Commit**

```bash
git add client/src/theme/tokens.ts
git commit -m "feat(tokens): create design token file with new storyboard palette"
```

---

## Task 2: Update `tailwind.config.js`

**Files:**
- Modify: `client/tailwind.config.js`

- [ ] **Step 1: Replace the config**

Replace the entire contents of `client/tailwind.config.js` with:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary brand
        'brand-dark':    '#063214',
        'brand-vibrant': '#00E676',
        // Functional
        'route-active':  '#4CAF50',
        'action-skip':   '#549A9C',
        'action-pick':   '#8BC34A',
        // Neutral
        'bg-light':      '#F5F5F7',
        // Map
        'user-dot':      '#3B82F6',
        'waypoint-target':'#EF4444',
        'loading-yellow':'#FFEB3B',
      },
      fontFamily: {
        sans:     ['Inter_400Regular'],
        semibold: ['Inter_600SemiBold'],
      },
      borderRadius: {
        pill: '50px',
        card: '12px',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Verify NativeWind classes resolve**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/tailwind.config.js
git commit -m "feat(tailwind): replace old Starbucks tokens with new storyboard palette"
```

---

## Task 3: Install `@shopify/react-native-skia`

**Files:**
- Modify: `client/package.json` (managed by Expo)

- [ ] **Step 1: Install via Expo**

```bash
cd client && npx expo install @shopify/react-native-skia
```

Expected output: package added to `package.json`, no peer dependency errors.

- [ ] **Step 2: Verify the install compiled**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors. (Skia's types are bundled with the package.)

- [ ] **Step 3: Commit**

```bash
git add client/package.json client/package-lock.json
git commit -m "feat(deps): install @shopify/react-native-skia"
```

---

## Task 4: Install `react-native-reorderable-list`

**Files:**
- Modify: `client/package.json`

- [ ] **Step 1: Install**

```bash
cd client && npx expo install react-native-reorderable-list
```

Expected: package added without peer dep errors.

- [ ] **Step 2: Commit**

```bash
git add client/package.json client/package-lock.json
git commit -m "feat(deps): install react-native-reorderable-list for draggable list"
```

---

## Task 5: Rewrite `DESIGN.md`

**Files:**
- Rewrite: `DESIGN.md` (repo root)

- [ ] **Step 1: Replace the file contents**

```markdown
# Meu Guia do Super — Design System

**Version:** 2.0 (Storyboard-aligned)  
**Source of truth for code:** `client/src/theme/tokens.ts`  
**Source of truth for Tailwind:** `client/tailwind.config.js`

---

## 1. Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `brandDark` | `#063214` | Splash background, nav bars, primary text, drawer frames, button text |
| `brandVibrant` | `#00E676` | App icon accent, CTA buttons, active route start, badge indicators |
| `routeActive` | `#4CAF50` | Continuous route path line, waypoint pulse rings |
| `actionSkip` | `#549A9C` | "Pular" swipe-action backdrop |
| `actionPick` | `#8BC34A` | "Coletado" swipe-action backdrop, confirmation overlay |
| `bgLight` | `#F5F5F7` | Page canvas, modal sheets, input backgrounds |
| `white` | `#FFFFFF` | Text on dark surfaces, card backgrounds |
| `textPrimary` | `#063214` | Heading text on light surfaces |
| `textSecondary` | `rgba(0,0,0,0.58)` | Body copy, subtitles |
| `border` | `#E2E8F0` | Card borders, dividers |
| `userDot` | `#3B82F6` | User position dot on map |
| `waypointTarget` | `#EF4444` | Active target waypoint pin |
| `loadingYellow` | `#FFEB3B` | Map loading state indicator |

**Rules:**
- Page canvas is always `bgLight` — never pure white.
- `brandVibrant` is the primary CTA color. Use it for the main action button on every screen.
- `brandDark` is the primary text and icon color on light surfaces.
- Never use gradients. The system is solid color-block throughout.

---

## 2. Typography

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `h1` | 24px | 700 | Screen headings |
| `h2` | 18px | 600 | Section headings, modal titles |
| `body` | 14px | 400 | Product names, descriptions |
| `meta` | 12px | 400 | SKU codes, distances, timestamps |
| `badge` | 10px | 700 | Counter badges, pill labels |

**Font:** SF Pro Display (iOS) / Inter (Android + web fallback). Use `Inter_400Regular` and `Inter_600SemiBold` from `@expo-google-fonts/inter` for all builds.

Letter-spacing: `-0.01em` on headings and CTAs.

---

## 3. Spacing & Layout Grid

| Token | Value | Usage |
|-------|-------|-------|
| `navBarHeight` | 56px | Top navigation bar fixed height |
| `safeAreaTop` | 44px | iOS safe area inset |
| `safeAreaBottom` | 34px | iOS home indicator inset |
| `drawerPeek` | 72px | Bottom sheet collapsed height |
| `drawerActive` | 340px | Bottom sheet standard height |
| `drawerExpanded` | 680px | Bottom sheet fully expanded |
| `gutter` | 16px | Left/right page margins |

**Grid:** 4-column fluid, 71px column width, 16px gutters, 16px outer margins.

---

## 4. Component Behavior Rules

### Primary CTA Button
- Background: `brandVibrant`
- Text: `brandDark`, bold, uppercase, 0.05em tracking
- Border radius: 50px (full pill)
- Height: 50px minimum
- Active state: `scale(0.97)` + opacity 0.95
- Disabled state: `opacity: 0.4`, no press response

### Bottom Sheet / Drawer
- Background: `white`
- Top corners: 24px radius
- Shadow: `elevation.drawer`
- Handle bar: `w-12 h-1 bg-slate-300 rounded-full` centred at top, 16px margin

### Swipe-to-Action Row
- Swipe threshold: ΔX ≥ 64px to lock action
- Lock offset: −160px translation
- Skip panel: `actionSkip` (#549A9C), "PULAR" white bold text
- Pick panel: `actionPick` (#8BC34A), "COLETADO →" white bold text
- Snap-back: `withSpring` on release if below threshold

### Item Card
- Background: `white`, 1px `border` stroke, 12px radius
- Active / top-of-queue: 2px `routeActive` border
- Red sequence badge: 20px circle, `#EF4444`, top-left absolute
- Distance label: `routeActive` color, bold mono

---

## 5. Map Canvas Rules (Skia)

All map drawing uses `@shopify/react-native-skia`. No DOM elements overlay the canvas.

### Layer render order (back → front)
1. Floor fill (`bgLight`) + optional dot grid
2. Shelf rectangles (fill from `shelf.color`, `border` stroke)
3. Aisle label text at shelf centroids
4. Route path (`routeActive`, strokeWidth 4, dashed in 2D overview)
5. Waypoint badges (circle + number)
6. User position dot (`userDot`, white stroke, radius 6)

### Aisle callout badge
- Dark rounded rect (`brandDark`, 6px radius)
- Arrow pointer below pointing to shelf
- `brandVibrant` circle left (item count)
- White text right of badge

### 3D axonometric projection
- Pitch: 30° (`θ = Math.PI / 6`)
- Yaw: 45° (`φ = Math.PI / 4`)
- Implemented in `client/src/utils/projection.ts` — no external 3D engine

---

## 6. Accessibility

- Minimum touch target: 44×44px
- Text contrast on `brandDark` backgrounds: `brandVibrant` and `white` only
- Text contrast on `bgLight` backgrounds: `brandDark` and `textSecondary` only
- All interactive elements have `accessibilityLabel` props
```

- [ ] **Step 2: Commit**

```bash
git add DESIGN.md
git commit -m "docs(design): rewrite DESIGN.md with storyboard token set"
```

---

## Task 6: Run frontend CI checks and push

- [ ] **Step 1: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: ESLint check**

```bash
cd client && npx eslint src/ app/ --max-warnings 0
```

Expected: no errors (if ESLint config exists; warnings from untouched files are pre-existing).

- [ ] **Step 3: Push and open PR**

```bash
git push origin feature/phase-8b-design-system
```

Open a PR from `feature/phase-8b-design-system` → `master`.
