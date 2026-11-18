import { StyleSheet, Text, View } from 'react-native';

import type { Trend } from '@/lib/types';
import { radius, spacing, typography, useTheme } from '@/theme';

import { TrendBadge } from './TrendBadge';

interface StatCardProps {
  label: string;
  /** Already formatted, e.g. '3,355'. */
  value: string;
  /** e.g. 'last week 3' */
  previousText: string;
  trend: Trend;
  percent: number | null;
}

export function StatCard({ label, value, previousText, trend, percent }: StatCardProps) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}, ${previousText}`}
      style={[styles.card, { backgroundColor: colors.surface }]}
    >
      {/* Wraps only when the badge is wide (No baseline) or text is large, so cards never clip. */}
      <View style={styles.top}>
        <Text style={[typography.body, { color: colors.inkMuted, fontWeight: '400' }]}>
          {label}
        </Text>
        <TrendBadge small trend={trend} percent={percent} />
      </View>
      <View style={styles.bottom}>
        <Text style={[styles.value, { color: colors.ink }]}>{value}</Text>
        <Text
          style={[typography.body, { color: colors.inkMuted, fontWeight: '400', fontSize: 13 }]}
        >
          {previousText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 96,
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.card,
  },
  top: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.sm,
    rowGap: spacing.xs,
  },
  bottom: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 6 },
  value: { fontSize: 28, fontWeight: '700', letterSpacing: -0.56 },
});
