import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, size, spacing, typography, useTheme } from '@/theme';

interface HeroCardProps {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}

// The dark card used on Today, Progress and Week totals. The design's radial glow
// (bottom-left) is approximated with a diagonal linear gradient.
export function HeroCard({ eyebrow, title, children }: HeroCardProps) {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={[colors.heroFrom, colors.heroTo]}
      locations={[0, 0.58]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={styles.card}
    >
      <View style={styles.content}>
        {eyebrow ? (
          <Text style={[typography.body, { color: colors.onHeroSoft, fontWeight: '400' }]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text accessibilityRole="header" style={[styles.title, { color: colors.onHero }]}>
          {title}
        </Text>
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: size.heroHeight,
    borderRadius: radius.hero,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  content: { alignItems: 'center', gap: 6 },
  title: { fontSize: 20, fontWeight: '600', textAlign: 'center', paddingHorizontal: spacing.lg },
});
