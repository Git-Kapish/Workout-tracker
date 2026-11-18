import Svg, { Path, Rect } from 'react-native-svg';

import { size } from '@/theme';

// 24px stroke icons, paths taken from the design source (DESIGN.md §1: round caps/joins).
export type IconName =
  | 'home'
  | 'calendar'
  | 'chart'
  | 'dumbbell'
  | 'plus'
  | 'close'
  | 'chevronRight'
  | 'chevronLeft'
  | 'moon'
  | 'arrowUp'
  | 'arrowDown'
  | 'minus'
  | 'trash';

interface IconProps {
  name: IconName;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export function Icon({ name, color, size: px = size.icon, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {name === 'home' && (
        <Path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z" />
      )}
      {name === 'calendar' && (
        <>
          <Rect x={4} y={5} width={16} height={15} rx={3} />
          <Path d="M4 10h16M8 3v4M16 3v4" />
        </>
      )}
      {name === 'chart' && <Path d="M5 20V12M12 20V5M19 20v-9" />}
      {name === 'dumbbell' && <Path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" />}
      {name === 'close' && <Path d="M6 6l12 12M18 6 6 18" />}
      {name === 'chevronRight' && <Path d="M9 5l7 7-7 7" />}
      {name === 'chevronLeft' && <Path d="M15 5l-7 7 7 7" />}
      {name === 'moon' && <Path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />}
      {name === 'arrowUp' && <Path d="M12 19V5M6 11l6-6 6 6" />}
      {name === 'arrowDown' && <Path d="M12 5v14M6 13l6 6 6-6" />}
      {name === 'minus' && <Path d="M6 12h12" />}
      {name === 'trash' && (
        <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
      )}
    </Svg>
  );
}
