import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { DayStrip } from '@/components/DayStrip';
import { EmptyState } from '@/components/EmptyState';
import { HeaderActions } from '@/components/HeaderActions';
import { EntryRow } from '@/components/EntryRow';
import { HeroCard } from '@/components/HeroCard';
import { LoadingState } from '@/components/LoadingState';
import { PillButton } from '@/components/PillButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TrendBadge } from '@/components/TrendBadge';
import { useNow } from '@/hooks/useNow';
import { useTabBarClearance } from '@/hooks/useTabBarClearance';
import { useTodayData } from '@/hooks/useTodayData';
import { todayLocal } from '@/lib/dates';
import {
  formatExerciseCount,
  formatLongDate,
  formatMonthDay,
  formatReps,
  greetingFor,
} from '@/lib/format';
import { radius, size, spacing, typography, useTheme } from '@/theme';

export default function TodayScreen() {
  const { colors } = useTheme();
  const clearance = useTabBarClearance();
  const now = useNow();
  const today = todayLocal(now);
  const data = useTodayData(today);
  const count = data.entries.length;

  const header = (
    <View style={styles.header}>
      <ScreenHeader
        datePill={formatMonthDay(today)}
        title={greetingFor(now.getHours())}
        right={<HeaderActions />}
        onTitleLongPress={__DEV__ ? () => router.push('/debug') : undefined}
      />
      <View style={styles.strip}>
        <DayStrip days={data.days} today={today} selected={today} />
      </View>
      <View style={styles.hero}>
        <HeroCard
          eyebrow={formatLongDate(today)}
          title={
            count === 0 ? 'No exercises logged yet' : `${formatExerciseCount(count)} logged so far`
          }
        >
          <PillButton
            label="Add exercise"
            variant="inverse"
            compact
            onPress={() => router.push('/log')}
            style={styles.heroButton}
          />
        </HeroCard>
      </View>
      <Text style={[typography.eyebrow, styles.eyebrow, { color: colors.inkMuted }]}>
        TODAY&apos;S LOG
      </Text>
    </View>
  );

  const footer = data.loading ? null : (
    <View style={[styles.summary, { backgroundColor: colors.surface }]}>
      <Text style={[typography.body, { color: colors.inkMuted }]}>
        This week ·{' '}
        <Text style={{ color: colors.ink, fontWeight: '600' }}>
          {formatReps(data.thisWeek.totalReps)}
        </Text>
      </Text>
      <TrendBadge
        trend={data.repsComparison.trend}
        percent={data.repsComparison.percent}
        suffix=" vs last week"
      />
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingBottom: clearance }]}
      data={data.entries}
      keyExtractor={(entry) => String(entry.id)}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <EntryRow entry={item} onPress={() => router.push(`/log?id=${item.id}`)} />
        </View>
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        data.loading ? (
          <LoadingState />
        ) : data.error ? (
          <View style={styles.row}>
            <EmptyState
              title="Couldn't load your log."
              message={data.error.message}
              actionLabel="Try again"
              onAction={data.reload}
            />
          </View>
        ) : (
          <View style={styles.row}>
            <EmptyState
              title="No exercises logged today."
              message="Tap Add exercise, or the + below, to log your first one."
            />
          </View>
        )
      }
      ListFooterComponent={<View style={styles.row}>{footer}</View>}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  header: { gap: 0 },
  strip: { marginTop: spacing.md + spacing.xs / 2 },
  hero: { marginTop: spacing.lg, paddingHorizontal: spacing.screenX },
  heroButton: { marginTop: spacing.md },
  eyebrow: { marginTop: 22, marginBottom: 10, marginHorizontal: spacing.xl },
  row: { paddingHorizontal: spacing.screenX, marginBottom: 10 },
  summary: {
    minHeight: size.summaryRow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.card,
  },
});
