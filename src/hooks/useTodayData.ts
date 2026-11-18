import { useMemo } from 'react';

import { compareWeeks } from '@/lib/compare';
import { summarize } from '@/lib/metrics';
import type { DateString, Entry, MetricComparison, Summary } from '@/lib/types';
import { previousWeekStart, weekEnd, weekRange } from '@/lib/weeks';

import type { DbError } from '@/db/errors';

import { useRepositoryQuery } from './useRepositoryQuery';

export interface TodayData {
  loading: boolean;
  error: DbError | null;
  /** Entries logged on `today`, in logging order. */
  entries: Entry[];
  /** Monday to Sunday of this week; `hasEntries` drives the dot under each day. */
  days: { date: DateString; hasEntries: boolean }[];
  thisWeek: Summary;
  /** Total reps this week vs last week: the app's overall status (PRD §7.4). */
  repsComparison: MetricComparison;
  reload: () => void;
}

/** One query covers this week and last week, then everything is derived by src/lib. */
export function useTodayData(today: DateString): TodayData {
  const week = useMemo(() => weekRange(today), [today]);
  const lastStart = previousWeekStart(today);
  const rangeEnd = weekEnd(today);
  const { data, loading, error, reload } = useRepositoryQuery(
    `today:${lastStart}:${rangeEnd}`,
    (r) => r.getByDateRange(lastStart, rangeEnd),
  );

  return useMemo(() => {
    const all = data ?? [];
    const thisWeekEntries = all.filter((e) => e.date >= week.start);
    const lastWeekEntries = all.filter((e) => e.date < week.start);
    const datesWithEntries = new Set(thisWeekEntries.map((e) => e.date));
    const thisWeek = summarize(thisWeekEntries);
    return {
      loading,
      error,
      entries: thisWeekEntries.filter((e) => e.date === today),
      days: week.days.map((date) => ({ date, hasEntries: datesWithEntries.has(date) })),
      thisWeek,
      repsComparison: compareWeeks(thisWeek, summarize(lastWeekEntries)).reps,
      reload,
    };
  }, [data, loading, error, reload, today, week.start, week.days]);
}
