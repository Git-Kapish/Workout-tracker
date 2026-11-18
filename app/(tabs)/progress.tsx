import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { OverallCard } from '@/components/OverallCard';
import { SegmentedToggle } from '@/components/SegmentedToggle';
import { StatCard } from '@/components/StatCard';
import { WeekBarChart } from '@/components/WeekBarChart';
import { WeekNavigator } from '@/components/WeekNavigator';
import { useToday } from '@/hooks/useNow';
import { useProgress } from '@/hooks/useProgress';
import { addDays } from '@/lib/dates';
import { formatNumber } from '@/lib/format';
import { chartBars, type ChartMetric } from '@/lib/progress';
import type { DateString } from '@/lib/types';
import { formatWeekLabel, previousWeekStart, weekStart } from '@/lib/weeks';
import { radius, spacing, typography, useTheme } from '@/theme';

const METRICS = [
  { value: 'reps', label: 'Reps', accessibilityLabel: 'Show reps' },
  { value: 'volume', label: 'Volume', accessibilityLabel: 'Show volume' },
] as const;

export default function ProgressScreen() {
  const { colors } = useTheme();
  const today = useToday();
  // Any day inside the week being compared; the week before it is the baseline.
  const [selected, setSelected] = useState<DateString>(today);
  const [metric, setMetric] = useState<ChartMetric>('reps');
  const progress = useProgress(selected);

  const start = weekStart(selected);
  const isCurrentWeek = start === weekStart(today);
  const previousLabel = isCurrentWeek ? 'last week' : 'prior week';
  const { comparison } = progress;

  const cards = [
    {
      label: 'Exercises',
      value: formatNumber(comparison.exercises.current, 0),
      previousText: `${previousLabel} ${formatNumber(comparison.exercises.previous, 0)}`,
      metric: comparison.exercises,
    },
    {
      label: 'Sets',
      value: formatNumber(comparison.sets.current, 0),
      previousText: `${previousLabel} ${formatNumber(comparison.sets.previous, 0)}`,
      metric: comparison.sets,
    },
    {
      label: 'Reps',
      value: formatNumber(comparison.reps.current, 0),
      previousText: `${previousLabel} ${formatNumber(comparison.reps.previous, 0)}`,
      metric: comparison.reps,
    },
    {
      label: 'Volume (kg)',
      value: formatNumber(comparison.volume.current),
      // Shorter than the others: this is the widest value and the card is narrow.
      previousText: `${isCurrentWeek ? 'last' : 'prior'} ${formatNumber(comparison.volume.previous)}`,
      metric: comparison.volume,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <WeekNavigator
        label="progress."
        caption={`${formatWeekLabel(start)} vs ${formatWeekLabel(previousWeekStart(start))}`}
        isCurrentWeek={isCurrentWeek}
        stackJump
        onPrevious={() => setSelected(addDays(selected, -7))}
        onNext={() => setSelected(addDays(selected, 7))}
        onJumpToToday={() => setSelected(today)}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {progress.loading ? (
          <LoadingState />
        ) : progress.error ? (
          <EmptyState
            title="Couldn't load your progress."
            message={progress.error.message}
            actionLabel="Try again"
            onAction={progress.reload}
          />
        ) : progress.isEmpty ? (
          <EmptyState
            icon="chart"
            title="No data yet"
            message="Log a few workouts and your week-over-week progress will show up here."
            actionLabel="Log an exercise"
            onAction={() => router.push('/log')}
          />
        ) : (
          <>
            <OverallCard comparison={comparison.reps} previousLabel={previousLabel} />

            <View style={styles.grid}>
              {[cards.slice(0, 2), cards.slice(2)].map((row) => (
                <View key={row[0]?.label} style={styles.gridRow}>
                  {row.map((card) => (
                    <StatCard
                      key={card.label}
                      label={card.label}
                      value={card.value}
                      previousText={card.previousText}
                      trend={card.metric.trend}
                      percent={card.metric.percent}
                    />
                  ))}
                </View>
              ))}
            </View>

            <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
              <View style={styles.chartHeader}>
                <Text
                  accessibilityRole="header"
                  style={[typography.rowTitle, { color: colors.ink, fontSize: 15 }]}
                >
                  Last 8 weeks
                </Text>
                <SegmentedToggle options={METRICS} value={metric} onChange={setMetric} />
              </View>
              <View style={styles.chart}>
                <WeekBarChart bars={chartBars(progress.series, metric)} metric={metric} />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  grid: { gap: spacing.md },
  gridRow: { flexDirection: 'row', gap: spacing.md },
  chartCard: {
    borderRadius: radius.hero,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chart: { marginTop: spacing.md },
});
