// WCAG 2.1 contrast ratio between two opaque or semi-transparent sRGB colours.
export type RGB = [number, number, number];

function parse(color: string): { rgb: RGB; alpha: number } {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex?.[1]) {
    const n = parseInt(hex[1], 16);
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 };
  }
  const rgba = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(color);
  if (rgba) {
    return { rgb: [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])], alpha: Number(rgba[4]) };
  }
  throw new Error(`Unsupported colour in test: ${color}`);
}

/** Paints `top` (maybe translucent) over the opaque `bottom`. */
export function over(top: string, bottom: string): RGB {
  const t = parse(top);
  const b = parse(bottom).rgb;
  return [0, 1, 2].map((i) => Math.round(t.rgb[i]! * t.alpha + b[i]! * (1 - t.alpha))) as RGB;
}

export const rgb = ([r, g, b]: RGB) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

function luminance([r, g, b]: RGB): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(fg: string, bg: string): number {
  const l1 = luminance(over(fg, bg));
  const l2 = luminance(parse(bg).rgb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
