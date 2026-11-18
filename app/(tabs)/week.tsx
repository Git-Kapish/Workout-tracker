import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { DayStrip } from '@/components/DayStrip';
import { EmptyState } from '@/components/EmptyState';
import { EntryRow } from '@/components/EntryRow';
import { LoadingState } from '@/components/LoadingState';
import { WeekNavigator } from '@/components/WeekNavigator';
import { WeekTotalsCard } from '@/components/WeekTotalsCard';
import { useToday } from '@/hooks/useNow';
import { useWeek } from '@/hooks/useWeek';
import { addDays, diffDays } from '@/lib/dates';
import { formatDayStats, formatDayTitle, formatWeekRelative } from '@/lib/format';
import type { DateString } from '@/lib/types';
import { formatWeekLabel, weekStart } from '@/lib/weeks';
import { spacing, typography, useTheme } from '@/theme';

export default function WeekScreen() {
  const { colors } = useTheme();
  const today = useToday();
  // The selected day is the only state: the week shown is the week containing it, and
  // moving a week keeps the weekday (Tuesday -> next Tuesday).
  const [selected, setSelected] = useState<DateString>(today);
  const week = useWeek(selected);
  const day = week.days.find((d) => d.date === selected);
  const start = weekStart(selected);
  const isCurrentWeek = start === weekStart(today);

  const emptyTitle = diffDays(selected, today) < 0 ? 'Rest day' : 'Nothing logged yet';

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <WeekNavigator
        label={formatWeekLabel(start)}
        caption={formatWeekRelative(start, today)}
        isCurrentWeek={isCurrentWeek}
        onPrevious={() => setSelected(addDays(selected, -7))}
        onNext={() => setSelected(addDays(selected, 7))}
        onJumpToToday={() => setSelected(today)}
      />
      <View style={styles.strip}>
        <DayStrip days={week.days} today={today} selected={selected} onSelect={setSelected} />
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
        renderItem={({ item }) => (
          <EntryRow entry={item} onPress={() => router.push(`/log?id=${item.id}`)} />
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
              onAction={() => router.push(`/log?date=${selected}`)}
            />
          )
        }
      />

      <View style={styles.totals}>
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
  totals: { marginHorizontal: spacing.screenX, marginTop: spacing.sm, marginBottom: 14 },
});
