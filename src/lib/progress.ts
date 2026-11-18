import { WEEKS_SHOWN } from './constants';
import { formatCompactNumber, formatNumber, formatNumericMonthDay } from './format';
import { groupByWeek, summarize } from './metrics';
import type { DateString, Entry, Summary } from './types';
import { lastNWeekStarts } from './weeks';

export type ChartMetric = 'reps' | 'volume';

export interface WeekPoint {
  weekStart: DateString;
  summary: Summary;
}

/**
 * One point per week for the `n` weeks ending with the week containing `endWeek`, oldest
 * first. Weeks with no entries are kept (as zeros) so the chart never skips a week.
 */
export function weeklySeries(
  entries: readonly Entry[],
  endWeek: DateString,
  n: number = WEEKS_SHOWN,
): WeekPoint[] {
  const byWeek = groupByWeek(entries);
  return lastNWeekStarts(endWeek, n).map((weekStart) => ({
    weekStart,
    summary: summarize(byWeek[weekStart] ?? []),
  }));
}

export interface ChartBar {
  weekStart: DateString;
  value: number;
  /** 0 to 1 relative to the tallest bar; 0 when every bar is 0 (never NaN). */
  ratio: number;
  /** Under the bar, e.g. '11/16'. */
  xLabel: string;
  /** Above the bar, e.g. '134' or '3.4k'. */
  valueLabel: string;
  /** The last bar is the selected week and is drawn in the accent colour. */
  isSelected: boolean;
}

export function chartBars(points: readonly WeekPoint[], metric: ChartMetric): ChartBar[] {
  const values = points.map((p) =>
    metric === 'reps' ? p.summary.totalReps : p.summary.totalVolumeKg,
  );
  const max = Math.max(0, ...values);
  return points.map((p, i) => {
    const value = values[i] ?? 0;
    return {
      weekStart: p.weekStart,
      value,
      ratio: max === 0 ? 0 : value / max,
      xLabel: formatNumericMonthDay(p.weekStart),
      valueLabel: metric === 'reps' ? formatNumber(value, 0) : formatCompactNumber(value),
      isSelected: i === points.length - 1,
    };
  });
}

/** True when every week in the series is empty (the Progress screen then says "No data yet"). */
export function isSeriesEmpty(points: readonly WeekPoint[]): boolean {
  return points.every((p) => p.summary.exerciseCount === 0);
}
