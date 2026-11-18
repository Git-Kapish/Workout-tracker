import { chartBars, isSeriesEmpty, weeklySeries } from '@/lib/progress';
import type { Entry } from '@/lib/types';

let id = 0;
const e = (date: string, reps: number, kg: number | null = null, sets = 1): Entry => ({
  id: ++id,
  exerciseName: 'X',
  sets,
  reps,
  weightKg: kg,
  date,
});

// One entry per week, Monday dates from docs/design/screens/05-progress.png.
const DESIGN_WEEKS = [
  ['2026-09-28', 88],
  ['2026-10-05', 96],
  // 2026-10-12 has no entries: the "0" stub bar
  ['2026-10-19', 101],
  ['2026-10-26', 94],
  ['2026-11-02', 99],
  ['2026-11-09', 107],
  ['2026-11-16', 134],
] as const;
const designEntries = DESIGN_WEEKS.map(([date, reps]) => e(date, reps));

describe('weeklySeries', () => {
  it('returns 8 consecutive weeks ending with the selected week, empty weeks as zeros', () => {
    const series = weeklySeries(designEntries, '2026-11-17');
    expect(series.map((p) => p.weekStart)).toEqual([
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
    ]);
    expect(series.map((p) => p.summary.totalReps)).toEqual([88, 96, 0, 101, 94, 99, 107, 134]);
  });

  it('buckets by Monday, so Sunday and Monday entries fall in different weeks', () => {
    const series = weeklySeries([e('2026-11-22', 10), e('2026-11-23', 20)], '2026-11-23', 2);
    expect(series.map((p) => p.summary.totalReps)).toEqual([10, 20]);
  });

  it('crosses New Year and ignores entries outside the window', () => {
    const series = weeklySeries(
      [
        e('2026-12-31', 5),
        e('2027-01-01', 6),
        e('2027-01-04', 7),
        e('2026-01-01', 99),
        e('2027-06-01', 99),
      ],
      '2027-01-04',
      2,
    );
    expect(series.map((p) => p.weekStart)).toEqual(['2026-12-28', '2027-01-04']);
    expect(series.map((p) => p.summary.totalReps)).toEqual([11, 7]);
  });

  it('can end on an older week (the selected week), not just the current one', () => {
    const series = weeklySeries(designEntries, '2026-10-20', 3);
    expect(series.map((p) => p.summary.totalReps)).toEqual([96, 0, 101]);
  });

  it('works with no entries', () => {
    const series = weeklySeries([], '2026-11-17');
    expect(series).toHaveLength(8);
    expect(isSeriesEmpty(series)).toBe(true);
  });
});

describe('chartBars', () => {
  const series = weeklySeries(designEntries, '2026-11-17');

  it('labels and scales reps like the mockup', () => {
    const bars = chartBars(series, 'reps');
    expect(bars.map((b) => b.xLabel)).toEqual([
      '9/28',
      '10/5',
      '10/12',
      '10/19',
      '10/26',
      '11/2',
      '11/9',
      '11/16',
    ]);
    expect(bars.map((b) => b.valueLabel)).toEqual([
      '88',
      '96',
      '0',
      '101',
      '94',
      '99',
      '107',
      '134',
    ]);
    expect(bars[7]?.ratio).toBe(1);
    expect(bars[2]?.ratio).toBe(0);
    expect(bars[0]?.ratio).toBeCloseTo(88 / 134);
  });

  it('marks only the last bar (the selected week)', () => {
    expect(chartBars(series, 'reps').map((b) => b.isSelected)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
  });

  it('uses volume, with compact labels', () => {
    // sets 1, reps 1, so volume = weight
    const volumes = [2640, 2780, 0, 2950, 2870, 3010, 3120, 3355].map((kg, i) =>
      kg === 0 ? null : e(DESIGN_WEEKS[i > 2 ? i - 1 : i]?.[0] ?? '2026-09-28', 1, kg),
    );
    const entries = volumes.filter((x): x is Entry => x !== null);
    const bars = chartBars(weeklySeries(entries, '2026-11-17'), 'volume');
    expect(bars.map((b) => b.valueLabel)).toEqual([
      '2.6k',
      '2.8k',
      '0',
      '3.0k',
      '2.9k',
      '3.0k',
      '3.1k',
      '3.4k',
    ]);
    expect(bars[7]?.ratio).toBe(1);
  });

  it('never divides by zero when every week is empty', () => {
    const bars = chartBars(weeklySeries([], '2026-11-17'), 'reps');
    expect(bars.every((b) => b.ratio === 0 && Number.isFinite(b.ratio))).toBe(true);
    expect(bars[0]?.valueLabel).toBe('0');
  });
});

describe('isSeriesEmpty', () => {
  it('is false as soon as any week has an entry', () => {
    expect(isSeriesEmpty(weeklySeries([e('2026-09-29', 5)], '2026-11-17'))).toBe(false);
  });
});
