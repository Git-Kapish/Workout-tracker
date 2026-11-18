import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { size, spacing, typography, useTheme } from '@/theme';

import { DarkCard } from './DarkCard';

interface HeroCardProps {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}

// The dark centred card used on Today and Progress.
export function HeroCard({ eyebrow, title, children }: HeroCardProps) {
  const { colors } = useTheme();
  return (
    <DarkCard style={styles.card}>
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
    </DarkCard>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: size.heroHeight, justifyContent: 'center', paddingVertical: spacing.lg },
  content: { alignItems: 'center', gap: 6 },
  title: { fontSize: 20, fontWeight: '600', textAlign: 'center', paddingHorizontal: spacing.lg },
});
