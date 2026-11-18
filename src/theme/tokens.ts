// Shape, spacing and type tokens from DESIGN.md §1.

export const radius = {
  card: 22,
  hero: 28,
  sheet: 36,
  input: 16,
  tile: 14,
  historyRow: 18,
  full: 999,
} as const;

export const spacing = {
  screenX: 20,
  sectionGap: 14,
  rowGap: 8,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const size = {
  tapMin: 44,
  pillButton: 56,
  inputName: 56,
  inputNumeric: 64,
  tabBar: 92,
  tabItemW: 64,
  tabItemH: 56,
  plusButton: 56,
  icon: 24,
} as const;

export const typography = {
  screenTitle: { fontSize: 20, fontWeight: '600', letterSpacing: -0.2 },
  display: { fontSize: 36, fontWeight: '700', letterSpacing: -1.08 },
  heroNumber: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
  sheetTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.52 },
  statNumber: { fontSize: 23, fontWeight: '700' },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '500' },
  caption: { fontSize: 12, fontWeight: '500' },
  tabLabel: { fontSize: 11, fontWeight: '500' },
  eyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 1.54 },
} as const;

export const tabBarShadow = {
  shadowOffset: { width: 0, height: -6 },
  shadowRadius: 24,
  shadowOpacity: 1,
  elevation: 8,
} as const;
