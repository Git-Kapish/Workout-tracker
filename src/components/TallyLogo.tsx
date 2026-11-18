import Svg, { Defs, Line, LinearGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/theme';
import { brand, type LogoVariant } from '@/theme/brand';

// Geometry of tally-logo-pack/svg/mark-color.svg: four bars and a slash (the tally mark for
// five). The slash carries the brand gradient. The viewBox is cropped to the mark itself.
const BARS = [28.5, 41.5, 54.5, 67.5];
const STROKE = 7;
const VIEW_W = 59;
const VIEW_H = 53;

interface TallyLogoProps {
  size: number;
  /** 'auto' picks the reversed mark in dark mode. */
  variant?: LogoVariant | 'auto';
}

export function TallyLogo({ size, variant = 'auto' }: TallyLogoProps) {
  const { isDark } = useTheme();
  const palette = brand[variant === 'auto' ? (isDark ? 'reversed' : 'color') : variant];
  const id = `tally-${palette.bar === brand.color.bar ? 'color' : 'reversed'}`;

  return (
    <Svg
      width={size}
      height={(size * VIEW_H) / VIEW_W}
      viewBox={`18.5 23.5 ${VIEW_W} ${VIEW_H}`}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Tally logo"
    >
      <Defs>
        <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1="22" y1="70" x2="74" y2="30">
          <Stop offset="0" stopColor={palette.gradient[0]} />
          <Stop offset="0.5" stopColor={palette.gradient[1]} />
          <Stop offset="1" stopColor={palette.gradient[2]} />
        </LinearGradient>
      </Defs>
      {BARS.map((x) => (
        <Line
          key={x}
          x1={x}
          y1={27}
          x2={x}
          y2={73}
          stroke={palette.bar}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
      ))}
      <Line
        x1={22}
        y1={70}
        x2={74}
        y2={30}
        stroke={`url(#${id})`}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}
