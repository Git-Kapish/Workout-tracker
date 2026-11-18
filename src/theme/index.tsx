import { createContext, use, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette, type Palette } from './colors';

export { floatingBar, radius, size, spacing, tabBarShadow, typography } from './tokens';
export type { Palette } from './colors';

const ForceLightContext = createContext(false);

/**
 * Everything inside always uses the light palette, even when the phone is in dark mode. For
 * fixed-colour scenes such as the pastel Welcome screen: components there still read their
 * colours from useTheme(), so buttons and text stay readable against the fixed background.
 */
export function ForceLightTheme({ children }: { children: ReactNode }) {
  return <ForceLightContext value={true}>{children}</ForceLightContext>;
}

export function useTheme(): { colors: Palette; isDark: boolean } {
  const forceLight = use(ForceLightContext);
  const scheme = useColorScheme();
  const isDark = !forceLight && scheme === 'dark';
  return { colors: isDark ? darkPalette : lightPalette, isDark };
}
