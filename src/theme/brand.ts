// The Tally logo colours, from the logo pack (tally-logo-pack/svg). `color` is for light
// surfaces, `reversed` for dark ones.
export const brand = {
  color: { bar: '#141414', gradient: ['#4F63F5', '#D63F95', '#E8651F'] },
  reversed: { bar: '#FFFFFF', gradient: ['#8FA2FF', '#F59BC8', '#F7B38A'] },
} as const;

export type LogoVariant = keyof typeof brand;
