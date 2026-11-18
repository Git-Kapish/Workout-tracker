import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { radius, useTheme } from '@/theme';

// The dark gradient surface shared by the hero and totals cards. The design's radial glow
// (bottom-left) is approximated with a diagonal linear gradient.
export function DarkCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={[colors.heroFrom, colors.heroTo]}
      locations={[0, 0.58]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={[{ borderRadius: radius.hero }, style]}
    >
      {children}
    </LinearGradient>
  );
}
