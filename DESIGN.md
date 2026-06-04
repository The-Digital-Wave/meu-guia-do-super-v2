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
| `textMeta` | `rgba(0,0,0,0.40)` | Timestamps, placeholder labels |
| `border` | `#E2E8F0` | Card borders, dividers |
| `userDot` | `#3B82F6` | User position dot on map |
| `waypointTarget` | `#EF4444` | Active target waypoint pin |
| `loadingYellow` | `#FFEB3B` | Map loading state indicator |

**Rules:**
- Page canvas is always `bgLight` — never pure white.
- `brandVibrant` is the primary CTA color on every screen.
- `brandDark` is the primary text and icon color on light surfaces.
- No gradients — the system is solid color-block throughout.


---

## 2. Typography

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `h1` | 24px | 700 | Screen headings |
| `h2` | 18px | 600 | Section headings, modal titles |
| `body` | 14px | 400 | Product names, descriptions |
| `meta` | 12px | 400 | SKU codes, distances, timestamps |
| `badge` | 10px | 700 | Counter badges, pill labels |

**Font:** SF Pro Display (iOS) / Inter (Android + web fallback). Use `Inter_400Regular` and `Inter_600SemiBold` from `@expo-google-fonts/inter`.

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
| `cardRadius` | 12px | Card border radius |
| `pillRadius` | 50px | Full-pill button border radius |

**Grid:** 4-column fluid, 71px column width, 16px gutters, 16px outer margins.

---

## 4. Component Behavior Rules

### Primary CTA Button
- Background: `brandVibrant`
- Text: `brandDark`, bold, uppercase, 0.05em tracking
- Border radius: `pillRadius` (50px full pill)
- Height: 50px minimum
- Active state: `scale(0.97)` + opacity 0.95
- Disabled: `opacity: 0.4`, no press response

### Bottom Sheet / Drawer
- Background: `white`
- Top corners: 24px radius
- Shadow: `elevation.drawer`
- Handle bar: 48px wide, 4px high, `border` color, centred, 16px margin

### Swipe-to-Action Row
- Swipe threshold: ΔX ≥ 64px to lock action
- Lock offset: −160px translation
- Skip panel: `actionSkip` (#549A9C)
- Pick panel: `actionPick` (#8BC34A)
- Snap-back: `withSpring` on release below threshold

---

## 5. Map Canvas Rules (Skia)

All map drawing uses `@shopify/react-native-skia`. No DOM elements overlay the canvas.

### Layer render order (back → front)
1. Floor fill (`bgLight`) + optional dot grid
2. Shelf rectangles (fill from `shelf.color`, `border` stroke)
3. Aisle label text at shelf centroids
4. Route path (`routeActive`, strokeWidth 4, dashed in 2D overview)
5. Waypoint badges (circle + sequence number)
6. User position dot (`userDot`, white stroke, radius 6)

### 3D axonometric projection
- Pitch: 30° (`θ = Math.PI / 6`)
- Yaw: 45° (`φ = Math.PI / 4`)
- Implemented in `client/src/utils/projection.ts` — no external 3D engine

---

## 6. Accessibility

- Minimum touch target: 44×44px
- Text on `brandDark` backgrounds: `brandVibrant` and `white` only
- Text on `bgLight` backgrounds: `brandDark` and `textSecondary` only
- All interactive elements must have `accessibilityLabel` props
