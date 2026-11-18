import { MAX_CHART_POINTS } from './constants';
import { formatNumber, formatNumericMonthDay } from './format';
import type { DateString, Entry } from './types';

export interface WeightPoint {
  date: DateString;
  weightKg: number;
}

/**
 * The heaviest weight lifted on each day the exercise was done (blank and 0 kg are not
 * weights), oldest first, limited to the most recent `limit` sessions.
 */
export function weightSeries(
  entries: readonly Entry[],
  limit: number = MAX_CHART_POINTS,
): WeightPoint[] {
  const heaviestPerDay = new Map<DateString, number>();
  for (const e of entries) {
    if (e.weightKg === null || e.weightKg <= 0) continue;
    const best = heaviestPerDay.get(e.date);
    if (best === undefined || e.weightKg > best) heaviestPerDay.set(e.date, e.weightKg);
  }
  return [...heaviestPerDay]
    .map(([date, weightKg]) => ({ date, weightKg }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(-limit);
}

const STEPS = [1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];

/**
 * Round-number gridline values covering [min, max] with two or three lines (the design shows
 * 35 / 40 / 45): the smallest step from STEPS that fits.
 */
export function axisTicks(min: number, max: number): number[] {
  const step =
    STEPS.find((s) => (Math.ceil(max / s) * s - Math.floor(min / s) * s) / s <= 2) ?? 1000;
  const lo = Math.floor(min / step) * step;
  let hi = Math.ceil(max / step) * step;
  if (hi === lo) hi = lo + step; // a flat line still needs a range to sit in
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 1000; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/** Drawing area in chart units: points sit between left/right, gridlines between top/bottom. */
export interface ChartBox {
  left: number;
  right: number;
  /** y of the highest gridline. */
  top: number;
  /** y of the lowest gridline. */
  bottom: number;
}

export interface LineChartLayout {
  ticks: { value: number; y: number; label: string }[];
  points: { x: number; y: number; weightKg: number; date: DateString }[];
  /** First, middle and last dates (fewer for short series). */
  xLabels: { x: number; label: string }[];
}

/**
 * Pure geometry for the weight line chart. Points are evenly spaced in session order (like
 * the design), so dense periods stay readable; the x labels carry the real dates.
 */
export function layoutLineChart(
  series: readonly WeightPoint[],
  box: ChartBox,
): LineChartLayout | null {
  if (series.length === 0) return null;
  const weights = series.map((p) => p.weightKg);
  const values = axisTicks(Math.min(...weights), Math.max(...weights));
  const lo = values[0] ?? 0;
  const hi = values[values.length - 1] ?? lo + 1;
  const yFor = (kg: number) => box.bottom - ((kg - lo) / (hi - lo)) * (box.bottom - box.top);
  const last = series.length - 1;
  const xFor = (i: number) =>
    last === 0 ? (box.left + box.right) / 2 : box.left + (i / last) * (box.right - box.left);

  const points = series.map((p, i) => ({ x: xFor(i), y: yFor(p.weightKg), ...p }));
  const labelIndexes = [...new Set([0, Math.floor(last / 2), last])];
  return {
    ticks: values.map((value) => ({ value, y: yFor(value), label: formatNumber(value) })),
    points,
    xLabels: labelIndexes.flatMap((i) => {
      const point = series[i];
      return point ? [{ x: xFor(i), label: formatNumericMonthDay(point.date) }] : [];
    }),
  };
}

/** Screen-reader summary of the chart. */
export function describeWeightTrend(name: string, series: readonly WeightPoint[]): string {
  const first = series[0];
  const last = series[series.length - 1];
  if (!first || !last) return `${name}: no weight recorded yet`;
  if (series.length === 1) return `${name}: ${formatNumber(first.weightKg)} kg, one session`;
  const verb =
    last.weightKg > first.weightKg ? 'rose' : last.weightKg < first.weightKg ? 'fell' : 'stayed';
  const change =
    verb === 'stayed'
      ? `at ${formatNumber(first.weightKg)} kg`
      : `from ${formatNumber(first.weightKg)} kg to ${formatNumber(last.weightKg)} kg`;
  return `${name} weight ${verb} ${change} over ${series.length} sessions`;
}
