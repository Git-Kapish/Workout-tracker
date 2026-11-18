import { darkPalette, lightPalette, type Palette } from '@/theme/colors';

// WCAG 2.1 contrast ratio between two opaque or semi-transparent sRGB colours.
type RGB = [number, number, number];

function parse(color: string): { rgb: RGB; alpha: number } {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex?.[1]) {
    const n = parseInt(hex[1], 16);
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 };
  }
  const rgba = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(color);
  if (rgba)
    return { rgb: [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])], alpha: Number(rgba[4]) };
  throw new Error(`Unsupported colour in test: ${color}`);
}

/** Paints `top` (maybe translucent) over the opaque `bottom`. */
function over(top: string, bottom: string): RGB {
  const t = parse(top);
  const b = parse(bottom).rgb;
  return [0, 1, 2].map((i) => Math.round(t.rgb[i]! * t.alpha + b[i]! * (1 - t.alpha))) as RGB;
}

function luminance([r, g, b]: RGB): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(fg: string, bg: string): number {
  const bgRgb = parse(bg).rgb;
  const l1 = luminance(over(fg, bg));
  const l2 = luminance(bgRgb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const TEXT = 4.5; // normal text
const NON_TEXT = 3; // icons, chart marks

// Every pair here is a real combination used somewhere in the app.
function pairs(c: Palette): { name: string; fg: string; bg: string; min: number }[] {
  return [
    { name: 'ink on screen', fg: c.ink, bg: c.bg, min: TEXT },
    { name: 'ink on card', fg: c.ink, bg: c.surface, min: TEXT },
    { name: 'ink on input', fg: c.ink, bg: c.fieldBg, min: TEXT },
    { name: 'muted text on screen', fg: c.inkMuted, bg: c.bg, min: TEXT },
    { name: 'muted text on card', fg: c.inkMuted, bg: c.surface, min: TEXT },
    { name: 'muted text / placeholder on input', fg: c.inkMuted, bg: c.fieldBg, min: TEXT },
    { name: 'button text (surface on ink)', fg: c.surface, bg: c.ink, min: TEXT },
    { name: 'link text on screen', fg: c.accentText, bg: c.bg, min: TEXT },
    { name: 'link text on card', fg: c.accentText, bg: c.surface, min: TEXT },
    { name: 'up badge', fg: c.trendUpFg, bg: c.trendUpBg, min: TEXT },
    { name: 'down badge', fg: c.trendDownFg, bg: c.trendDownBg, min: TEXT },
    { name: 'same / no baseline badge', fg: c.trendNeutralFg, bg: c.trendNeutralBg, min: TEXT },
    { name: 'error text on screen', fg: c.trendDownFg, bg: c.bg, min: TEXT },
    { name: 'error text on card', fg: c.trendDownFg, bg: c.surface, min: TEXT },
    { name: 'success note on card', fg: c.trendUpFg, bg: c.surface, min: TEXT },
    { name: 'hero text (start of gradient)', fg: c.onHero, bg: c.heroFrom, min: TEXT },
    { name: 'hero text (end of gradient)', fg: c.onHero, bg: c.heroTo, min: TEXT },
    { name: 'hero soft text (start)', fg: c.onHeroSoft, bg: c.heroFrom, min: TEXT },
    { name: 'hero soft text (end)', fg: c.onHeroSoft, bg: c.heroTo, min: TEXT },
    {
      name: 'hero up status on its pill',
      fg: c.onHeroUp,
      bg: rgb(over(c.onHeroPill, c.heroTo)),
      min: TEXT,
    },
    {
      name: 'hero down status on its pill',
      fg: c.onHeroDown,
      bg: rgb(over(c.onHeroPill, c.heroTo)),
      min: TEXT,
    },
    { name: 'soft text on the sheet backdrop', fg: c.inkSoft, bg: c.sheetBackdrop[0], min: TEXT },
    {
      name: 'soft text on the sheet backdrop (middle)',
      fg: c.inkSoft,
      bg: c.sheetBackdrop[1],
      min: TEXT,
    },
    {
      name: 'soft text on the sheet backdrop (end)',
      fg: c.inkSoft,
      bg: c.sheetBackdrop[2],
      min: TEXT,
    },
    { name: 'ink on the sheet backdrop', fg: c.ink, bg: c.sheetBackdrop[1], min: TEXT },
    { name: 'icon on its tile', fg: c.accent, bg: c.accentTint, min: NON_TEXT },
    { name: 'chart line on card', fg: c.accent, bg: c.surface, min: NON_TEXT },
    { name: 'past-week bars on card', fg: c.barPast, bg: c.surface, min: NON_TEXT },
    { name: 'selected bar on card', fg: c.ink, bg: c.surface, min: NON_TEXT },
  ];
}

const rgb = ([r, g, b]: RGB) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

describe.each([
  ['light', lightPalette],
  ['dark', darkPalette],
] as const)('%s palette contrast (WCAG 2.1)', (_name, palette) => {
  it.each(pairs(palette))('$name', ({ fg, bg, min }) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});

describe('the two palettes stay in sync', () => {
  it('define exactly the same tokens', () => {
    expect(Object.keys(darkPalette).sort()).toEqual(Object.keys(lightPalette).sort());
  });
});
