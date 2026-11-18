import { useMemo } from 'react';

import type { DbError } from '@/db/errors';
import { compareWeeks } from '@/lib/compare';
import { WEEKS_SHOWN } from '@/lib/constants';
import { isSeriesEmpty, weeklySeries, type WeekPoint } from '@/lib/progress';
import type { Comparison, DateString, Summary } from '@/lib/types';
import { lastNWeekStarts, weekEnd } from '@/lib/weeks';

import { useRepositoryQuery } from './useRepositoryQuery';

export interface ProgressData {
  loading: boolean;
  error: DbError | null;
  /** Oldest first; the last point is the selected week. */
  series: WeekPoint[];
  current: Summary;
  previous: Summary;
  comparison: Comparison;
  /** No entries at all in the shown weeks. */
  isEmpty: boolean;
  reload: () => void;
}

const ZERO: Summary = { totalSets: 0, totalReps: 0, totalVolumeKg: 0, exerciseCount: 0 };

/**
 * One query for the eight weeks ending with the week containing `date`. That window already
 * holds the previous week, so the comparison needs no second query.
 */
export function useProgress(date: DateString): ProgressData {
  const first = lastNWeekStarts(date, WEEKS_SHOWN)[0] ?? date;
  const end = weekEnd(date);
  const { data, loading, error, reload } = useRepositoryQuery(`progress:${first}:${end}`, (r) =>
    r.getByDateRange(first, end),
  );

  return useMemo(() => {
    const series = weeklySeries(data ?? [], date);
    const current = series[series.length - 1]?.summary ?? ZERO;
    const previous = series[series.length - 2]?.summary ?? ZERO;
    return {
      loading,
      error,
      series,
      current,
      previous,
      comparison: compareWeeks(current, previous),
      isEmpty: isSeriesEmpty(series),
      reload,
    };
  }, [data, date, loading, error, reload]);
}
