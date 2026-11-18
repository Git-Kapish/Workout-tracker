import { memo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useWeek } from '@/hooks/useWeek';
import { diffDays } from '@/lib/dates';
import { formatDayStats, formatDayTitle } from '@/lib/format';
import type { DateString } from '@/lib/types';
import { spacing, typography, useTheme } from '@/theme';

import { DayStrip } from './DayStrip';
import { EmptyState } from './EmptyState';
import { EntryRow } from './EntryRow';
import { LoadingState } from './LoadingState';
import { WeekTotalsCard } from './WeekTotalsCard';

interface WeekPageProps {
  /** The Monday of the week this page shows. */
  weekStartDate: DateString;
  /** 0 (Monday) to 6 (Sunday): the day highlighted on every page while swiping. */
  weekday: number;
  today: DateString;
  width: number;
  height: number;
  /** Space the floating tab bar covers at the bottom. */
  bottomInset: number;
  onSelectWeekday: (weekday: number) => void;
  onOpenEntry: (id: number) => void;
  onLogOnDay: (date: DateString) => void;
}

/**
 * One week of the Week tab pager: day strip, the selected day's entries, and week totals. It
 * loads its own week, so the neighbouring weeks are ready by the time you swipe to them.
 */
export const WeekPage = memo(function WeekPage({
  weekStartDate,
  weekday,
  today,
  width,
  height,
  bottomInset,
  onSelectWeekday,
  onOpenEntry,
  onLogOnDay,
}: WeekPageProps) {
  const { colors } = useTheme();
  const week = useWeek(weekStartDate);
  const day = week.days[weekday];
  const selected = day?.date ?? weekStartDate;
  const emptyTitle = diffDays(selected, today) < 0 ? 'Rest day' : 'Nothing logged yet';

  return (
    <View style={{ width, height }}>
      <View style={styles.strip}>
        <DayStrip
          days={week.days}
          today={today}
          selected={selected}
          onSelect={(date) => onSelectWeekday(week.days.findIndex((d) => d.date === date))}
        />
      </View>

      <View style={styles.heading}>
        <Text
          accessibilityRole="header"
          style={[typography.rowTitle, styles.title, { color: colors.ink }]}
        >
          {formatDayTitle(selected, today)}
        </Text>
        <Text style={[typography.caption, styles.stats, { color: colors.inkMuted }]}>
          {day ? formatDayStats(day.summary) : ''}
        </Text>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={day?.entries ?? []}
        keyExtractor={(entry) => String(entry.id)}
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => <EntryRow entry={item} onPress={() => onOpenEntry(item.id)} />}
        ListEmptyComponent={
          week.loading ? (
            <LoadingState />
          ) : week.error ? (
            <EmptyState
              title="Couldn't load this week."
              message={week.error.message}
              actionLabel="Try again"
              onAction={week.reload}
            />
          ) : (
            <EmptyState
              icon="moon"
              title={emptyTitle}
              message="Rest days are part of the plan."
              actionLabel="Log an exercise"
              onAction={() => onLogOnDay(selected)}
            />
          )
        }
      />

      <View style={[styles.totals, { marginBottom: bottomInset }]}>
        <WeekTotalsCard summary={week.summary} />
      </View>
    </View>
  );
});

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  strip: { marginTop: spacing.lg },
  heading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: 18,
    marginBottom: 10,
  },
  title: { flexShrink: 1 },
  stats: { fontSize: 13, textAlign: 'right', flexShrink: 1 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.screenX },
  separator: { height: 10 },
  totals: { marginHorizontal: spacing.screenX, marginTop: spacing.sm },
});
