import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { CalendarSheet } from '@/components/CalendarSheet';
import { DayStrip } from '@/components/DayStrip';
import { Enter } from '@/components/Enter';
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
import { useWeek } from '@/hooks/useWeek';
import { diffDays, todayLocal } from '@/lib/dates';
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
  // The day being previewed: today until a day is picked in the strip or the calendar.
  const [selected, setSelected] = useState(today);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const data = useTodayData(today);
  const week = useWeek(selected);
  const entries = week.days.find((d) => d.date === selected)?.entries ?? [];
  const count = entries.length;
  const isToday = selected === today;
  const isPast = diffDays(selected, today) < 0;

  const header = (
    <View style={styles.header}>
      <ScreenHeader
        datePill={formatMonthDay(selected)}
        onDatePress={() => setCalendarOpen(true)}
        title={greetingFor(now.getHours())}
        right={<HeaderActions />}
      />
      <View style={styles.strip}>
        <DayStrip days={week.days} today={today} selected={selected} onSelect={setSelected} />
      </View>
      <Enter style={styles.hero}>
        <HeroCard
          eyebrow={formatLongDate(selected)}
          title={
            count === 0
              ? isToday
                ? 'No exercises logged yet'
                : 'Nothing logged'
              : `${formatExerciseCount(count)} logged${isToday ? ' so far' : ''}`
          }
        >
          <PillButton
            label="Add exercise"
            variant="inverse"
            compact
            onPress={() => router.push(isToday ? '/log' : `/log?date=${selected}`)}
            style={styles.heroButton}
          />
        </HeroCard>
      </Enter>
      <Text style={[typography.eyebrow, styles.eyebrow, { color: colors.inkMuted }]}>
        {isToday ? "TODAY'S LOG" : `${formatMonthDay(selected).toUpperCase()} LOG`}
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
      {/* The badge top-aligns itself, so it gets its own box that the row can centre. */}
      <View>
        <TrendBadge
          trend={data.repsComparison.trend}
          percent={data.repsComparison.percent}
          suffix=" vs last week"
        />
      </View>
    </View>
  );

  return (
    <>
      <FlatList
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={[styles.content, { paddingBottom: clearance }]}
        data={entries}
        keyExtractor={(entry) => String(entry.id)}
        renderItem={({ item, index }) => (
          <Enter index={index} style={styles.row}>
            <EntryRow entry={item} onPress={() => router.push(`/log?id=${item.id}`)} />
          </Enter>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          week.loading ? (
            <LoadingState />
          ) : week.error ? (
            <View style={styles.row}>
              <EmptyState
                title="Couldn't load your log."
                message={week.error.message}
                actionLabel="Try again"
                onAction={week.reload}
              />
            </View>
          ) : (
            <View style={styles.row}>
              <EmptyState
                title={isToday ? 'No exercises logged today.' : 'No exercises logged this day.'}
                message={
                  isPast
                    ? 'Tap Add exercise to log something you did that day.'
                    : 'Tap Add exercise, or the + below, to log your first one.'
                }
              />
            </View>
          )
        }
        ListFooterComponent={<View style={styles.row}>{footer}</View>}
      />
      <CalendarSheet
        visible={calendarOpen}
        selected={selected}
        today={today}
        onClose={() => setCalendarOpen(false)}
        onSelect={(date) => {
          setSelected(date);
          setCalendarOpen(false);
        }}
      />
    </>
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
