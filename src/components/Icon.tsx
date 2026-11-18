import Svg, { Path, Rect } from 'react-native-svg';

import { size } from '@/theme';

// Lucide-style 24px stroke icons (DESIGN.md §1): stroke 1.8, round caps/joins.
export type IconName = 'home' | 'calendar' | 'chart' | 'dumbbell' | 'plus';

interface IconProps {
  name: IconName;
  color: string;
  size?: number;
}

export function Icon({ name, color, size: px = size.icon }: IconProps) {
  return (
    <Svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {name === 'home' && (
        <>
          <Path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
          <Path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Path d="M8 2v4M16 2v4M3 10h18" />
          <Rect x={3} y={4} width={18} height={18} rx={2} />
        </>
      )}
      {name === 'chart' && <Path d="M18 20V10M12 20V4M6 20v-6" />}
      {name === 'dumbbell' && <Path d="M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12" />}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" />}
    </Svg>
  );
}
