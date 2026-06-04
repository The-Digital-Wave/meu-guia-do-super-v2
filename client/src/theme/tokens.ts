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
