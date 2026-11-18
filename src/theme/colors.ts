// Tokens from DESIGN.md §1. No hard-coded colours in components: read them from useTheme().

export interface Palette {
  bg: string;
  surface: string;
  ink: string;
  inkMuted: string;
  inkSoft: string;
  fieldBg: string;
  hairline: string;
  placeholder: string;
  accent: string;
  /** Accent for small text (links); darker than ccent so it reaches 4.5:1 on g. */
  accentText: string;
  accentTint: string;
  barPast: string;
  trendUpBg: string;
  trendUpFg: string;
  // Not in the design yet (DESIGN.md §1 "Trend colours"): derived red pair.
  trendDownBg: string;
  trendDownFg: string;
  trendNeutralBg: string;
  trendNeutralFg: string;
  heroFrom: string;
  heroTo: string;
  onHero: string;
  onHeroMuted: string;
  onHeroSoft: string;
  /** Status colours and pill background on the dark hero card. */
  onHeroUp: string;
  onHeroDown: string;
  onHeroPill: string;
  /** Gradient behind the Log sheet, top-left to bottom-right (160deg). */
  sheetBackdrop: readonly [string, string, string];
  /** Frosted stand-in for liquid glass (iOS before 26, or Reduce Transparency on). */
  glassFallback: string;
  glassBorder: string;
  shadow: string;
}

export const lightPalette: Palette = {
  bg: '#F3F3F5',
  surface: '#FFFFFF',
  ink: '#141414',
  inkMuted: '#6B6B73',
  inkSoft: '#4A4A55',
  fieldBg: '#F0F0F3',
  hairline: '#ECECF0',
  placeholder: '#C4C4CC',
  accent: '#4F63F5',
  accentText: '#3F51E0',
  accentTint: '#EEF0FF',
  barPast: '#7C86E8',
  trendUpBg: '#E3F4EA',
  trendUpFg: '#1E7B4B',
  trendDownBg: '#FBE4E4',
  trendDownFg: '#B3261E',
  trendNeutralBg: '#F0F0F3',
  trendNeutralFg: '#6B6B73',
  heroFrom: '#3B3B42',
  heroTo: '#111113',
  onHero: '#FFFFFF',
  onHeroMuted: 'rgba(255,255,255,0.65)',
  onHeroSoft: '#C4C4CC',
  onHeroUp: '#8BE9B0',
  onHeroDown: '#FF9B94',
  onHeroPill: 'rgba(255,255,255,0.14)',
  sheetBackdrop: ['#CFE3F5', '#F3D7E5', '#FBE3D2'],
  glassFallback: 'rgba(255,255,255,0.92)',
  glassBorder: 'rgba(255,255,255,0.9)',
  shadow: 'rgba(20,20,30,0.06)',
};

// PROVISIONAL: dark mode is not designed yet (DESIGN.md §3.4, built in Phase 6).
// Same keys so every component already reads colours through the theme.
export const darkPalette: Palette = {
  bg: '#0E0E10',
  surface: '#1A1A1E',
  ink: '#F4F4F6',
  inkMuted: '#9A9AA5',
  inkSoft: '#C2C2CC',
  fieldBg: '#26262B',
  hairline: '#2C2C32',
  placeholder: '#5A5A64',
  accent: '#7B8BFF',
  accentText: '#7B8BFF',
  accentTint: '#23264A',
  barPast: '#5963C8',
  trendUpBg: '#16352A',
  trendUpFg: '#6FD4A0',
  trendDownBg: '#3D1B1B',
  trendDownFg: '#FF8A80',
  trendNeutralBg: '#26262B',
  trendNeutralFg: '#9A9AA5',
  heroFrom: '#3B3B42',
  heroTo: '#111113',
  onHero: '#FFFFFF',
  onHeroMuted: 'rgba(255,255,255,0.65)',
  onHeroSoft: '#C4C4CC',
  onHeroUp: '#8BE9B0',
  onHeroDown: '#FF9B94',
  onHeroPill: 'rgba(255,255,255,0.14)',
  sheetBackdrop: ['#1F2A3A', '#2E2233', '#33271F'],
  glassFallback: 'rgba(38,38,44,0.94)',
  glassBorder: 'rgba(255,255,255,0.12)',
  shadow: 'rgba(0,0,0,0.4)',
};
