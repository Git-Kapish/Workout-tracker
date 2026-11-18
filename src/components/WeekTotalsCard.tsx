import { StyleSheet, Text, View } from 'react-native';

import { formatNumber } from '@/lib/format';
import type { Summary } from '@/lib/types';
import { spacing, typography, useTheme } from '@/theme';

import { DarkCard } from './DarkCard';

export function WeekTotalsCard({ summary }: { summary: Summary }) {
  const { colors } = useTheme();
  const one = (n: number, singular: string, plural: string) => (n === 1 ? singular : plural);
  const stats = [
    {
      value: formatNumber(summary.exerciseCount, 0),
      label: one(summary.exerciseCount, 'exercise', 'exercises'),
    },
    { value: formatNumber(summary.totalSets, 0), label: one(summary.totalSets, 'set', 'sets') },
    { value: formatNumber(summary.totalReps, 0), label: one(summary.totalReps, 'rep', 'reps') },
    { value: formatNumber(summary.totalVolumeKg), label: 'kg volume' },
  ];

  return (
    <DarkCard style={styles.card}>
      <Text style={[typography.eyebrow, { color: colors.onHeroSoft }]}>WEEK TOTALS</Text>
      <View style={styles.row}>
        {stats.map(({ value, label }) => (
          <View key={label} accessible accessibilityLabel={`${value} ${label}`}>
            <Text style={[typography.statNumber, styles.value, { color: colors.onHero }]}>
              {value}
            </Text>
            <Text style={[typography.caption, { color: colors.onHeroSoft }]}>{label}</Text>
          </View>
        ))}
      </View>
    </DarkCard>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.lg, paddingHorizontal: spacing.screenX },
  row: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  value: { fontSize: 22 },
});
