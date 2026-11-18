import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useWeek } from '@/hooks/useWeek';
import { diffDays } from '@/lib/dates';
import { formatDayStats, formatDayTitle } from '@/lib/format';
import type { DateString } from '@/lib/types';
import { radius, spacing, typography, useTheme } from '@/theme';

import { EmptyState } from './EmptyState';
import { Enter } from './Enter';
import { EntryRow } from './EntryRow';
import { LoadingState } from './LoadingState';
import { WeekTotalsCard } from './WeekTotalsCard';

interface WeekDetailProps {
  /** The Monday of the week shown in the day row above. */
  weekStartDate: DateString;
  /** 0 (Monday) to 6 (Sunday). */
  weekday: number;
  today: DateString;
  /** Space the floating tab bar covers at the bottom. */
  bottomInset: number;
  onOpenEntry: (id: number) => void;
  onLogOnDay: (date: DateString) => void;
}

/** Everything under the day row: the selected day's entries and the week totals. It stays put while the row above is swiped. */
export function WeekDetail({
  weekStartDate,
  weekday,
  today,
  bottomInset,
  onOpenEntry,
  onLogOnDay,
}: WeekDetailProps) {
  const { colors } = useTheme();
  // The totals card floats over the list, so the list is padded by the card's measured height.
  const [cardHeight, setCardHeight] = useState(120);
  const week = useWeek(weekStartDate);
  const day = week.days[weekday];
  const selected = day?.date ?? weekStartDate;
  const emptyTitle = diffDays(selected, today) < 0 ? 'Rest day' : 'Nothing logged yet';

  return (
    <View style={styles.root}>
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
        testID="week-detail-list"
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomInset + cardHeight + spacing.md },
        ]}
        data={day?.entries ?? []}
        keyExtractor={(entry) => String(entry.id)}
        ItemSeparatorComponent={Separator}
        renderItem={({ item, index }) => (
          <Enter index={index}>
            <EntryRow entry={item} onPress={() => onOpenEntry(item.id)} />
          </Enter>
        )}
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

      <View
        testID="week-totals-float"
        onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)}
        style={[
          styles.totals,
          { bottom: bottomInset, boxShadow: `0 10px 28px ${colors.floatShadow}` },
        ]}
      >
        <WeekTotalsCard summary={week.summary} />
      </View>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  totals: {
    position: 'absolute',
    left: spacing.screenX,
    right: spacing.screenX,
    borderRadius: radius.hero,
  },
});
