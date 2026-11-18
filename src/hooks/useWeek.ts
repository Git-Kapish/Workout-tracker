import { useMemo } from 'react';

import type { DbError } from '@/db/errors';
import { groupByDay, summarize } from '@/lib/metrics';
import type { DateString, Entry, Summary } from '@/lib/types';
import { weekRange } from '@/lib/weeks';

import { useRepositoryQuery } from './useRepositoryQuery';

export interface WeekDay {
  date: DateString;
  hasEntries: boolean;
  /** In logging order. */
  entries: Entry[];
  summary: Summary;
}

export interface WeekData {
  loading: boolean;
  error: DbError | null;
  /** Monday to Sunday of the week containing the requested date. */
  days: WeekDay[];
  summary: Summary;
  reload: () => void;
}

/** One range query for the week; grouping and totals come from src/lib. */
export function useWeek(date: DateString): WeekData {
  const range = useMemo(() => weekRange(date), [date]);
  const { data, loading, error, reload } = useRepositoryQuery(`week:${range.start}`, (r) =>
    r.getByDateRange(range.start, range.end),
  );

  return useMemo(() => {
    const entries = data ?? [];
    const byDay = groupByDay(entries);
    return {
      loading,
      error,
      days: range.days.map((day) => {
        const dayEntries = byDay[day] ?? [];
        return {
          date: day,
          hasEntries: dayEntries.length > 0,
          entries: dayEntries,
          summary: summarize(dayEntries),
        };
      }),
      summary: summarize(entries),
      reload,
    };
  }, [data, loading, error, reload, range]);
}
