import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette, type Palette } from './colors';

export { radius, size, spacing, tabBarShadow, typography } from './tokens';
export type { Palette } from './colors';

export function useTheme(): { colors: Palette; isDark: boolean } {
  const isDark = useColorScheme() === 'dark';
  return { colors: isDark ? darkPalette : lightPalette, isDark };
}
