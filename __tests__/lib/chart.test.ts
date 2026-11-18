import { axisTicks, describeWeightTrend, layoutLineChart, weightSeries } from '@/lib/chart';
import { addDays } from '@/lib/dates';
import type { Entry } from '@/lib/types';

let id = 0;
const e = (date: string, weightKg: number | null, name = 'Bench Press'): Entry => ({
  id: ++id,
  exerciseName: name,
  date,
  sets: 3,
  reps: 10,
  weightKg,
});

describe('weightSeries', () => {
  it('takes the heaviest weight per day, oldest first, ignoring blank and 0 kg', () => {
    const series = weightSeries([
      e('2026-11-16', 42.5),
      e('2026-11-09', 40),
      e('2026-11-09', 42), // heavier set the same day wins
      e('2026-11-02', null),
      e('2026-11-03', 0),
    ]);
    expect(series).toEqual([
      { date: '2026-11-09', weightKg: 42 },
      { date: '2026-11-16', weightKg: 42.5 },
    ]);
  });

  it('keeps only the most recent sessions when there are too many', () => {
    const many = Array.from({ length: 40 }, (_, i) => e(addDays('2026-01-01', i), 20 + i));
    const series = weightSeries(many, 5);
    expect(series).toHaveLength(5);
    expect(series[4]?.weightKg).toBe(59); // newest kept
  });

  it('is empty for a bodyweight exercise or no entries', () => {
    expect(weightSeries([e('2026-11-16', null)])).toEqual([]);
    expect(weightSeries([])).toEqual([]);
  });
});

describe('axisTicks', () => {
  it('picks round gridlines like the design (data 37.5 to 45 gives 35, 40, 45)', () => {
    expect(axisTicks(37.5, 45)).toEqual([35, 40, 45]);
  });

  it('adapts to the range', () => {
    expect(axisTicks(40, 42.5)).toEqual([40, 42, 44]);
    expect(axisTicks(60, 65)).toEqual([60, 62.5, 65]);
    expect(axisTicks(100, 180)).toEqual([100, 150, 200]);
    expect(axisTicks(20, 220)).toEqual([0, 200, 400]);
  });

  it('always covers the data and has two or three lines', () => {
    for (const [min, max] of [
      [37.5, 45],
      [40, 40],
      [0.5, 1],
      [87.5, 92.5],
      [1, 999],
      [22.25, 22.5],
    ] as const) {
      const ticks = axisTicks(min, max);
      expect(ticks.length === 2 || ticks.length === 3).toBe(true);
      expect(ticks[0]).toBeLessThanOrEqual(min);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(max);
    }
  });

  it('gives a flat series a range to sit in (never a zero-height axis)', () => {
    const ticks = axisTicks(40, 40);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    expect(ticks[ticks.length - 1]).toBeGreaterThan(ticks[0] ?? 0);
  });
});

describe('layoutLineChart (box from docs/design/source/ExerciseDetail.dc.html)', () => {
  const BOX = { left: 36, right: 296, top: 32, bottom: 104 };
  // The mockup's eight weekly sessions.
  const weights = [37.5, 37.5, 40, 40, 42.5, 42.5, 42.5, 45];
  const series = weights.map((weightKg, i) => ({
    date:
      [
        '2026-09-28',
        '2026-10-05',
        '2026-10-12',
        '2026-10-19',
        '2026-10-26',
        '2026-11-02',
        '2026-11-09',
        '2026-11-16',
      ][i] ?? '',
    weightKg,
  }));

  it('puts the gridlines at the mockup positions', () => {
    const layout = layoutLineChart(series, BOX);
    expect(layout?.ticks.map((t) => [t.label, t.y])).toEqual([
      ['35', 104],
      ['40', 68],
      ['45', 32],
    ]);
  });

  it('puts the points where the mockup draws them', () => {
    const points = layoutLineChart(series, BOX)?.points ?? [];
    expect(points).toHaveLength(8);
    expect(points[0]).toMatchObject({ x: 36, y: 86 });
    expect(points[7]).toMatchObject({ x: 296, y: 32 });
    expect(Math.round(points[2]?.x ?? 0)).toBe(110);
    expect(points[2]?.y).toBe(68);
    expect(points[4]?.y).toBe(50);
  });

  it('labels the first, middle and last dates', () => {
    const labels = layoutLineChart(series, BOX)?.xLabels ?? [];
    expect(labels.map((l) => l.label)).toEqual(['9/28', '10/19', '11/16']);
    expect(labels[0]?.x).toBe(36);
    expect(labels[2]?.x).toBe(296);
  });

  it('centres a single session and labels it once', () => {
    const layout = layoutLineChart([{ date: '2026-11-16', weightKg: 40 }], BOX);
    expect(layout?.points).toHaveLength(1);
    expect(layout?.points[0]?.x).toBe(166);
    expect(Number.isFinite(layout?.points[0]?.y)).toBe(true);
    expect(layout?.xLabels.map((l) => l.label)).toEqual(['11/16']);
  });

  it('labels two sessions as first and last, and handles a flat series without NaN', () => {
    const two = layoutLineChart(
      [
        { date: '2026-11-09', weightKg: 40 },
        { date: '2026-11-16', weightKg: 40 },
      ],
      BOX,
    );
    expect(two?.xLabels.map((l) => l.label)).toEqual(['11/9', '11/16']);
    expect(two?.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
  });

  it('returns null with nothing to draw', () => {
    expect(layoutLineChart([], BOX)).toBeNull();
  });

  it('keeps every point inside the box', () => {
    const layout = layoutLineChart(series, BOX);
    for (const p of layout?.points ?? []) {
      expect(p.y).toBeGreaterThanOrEqual(BOX.top);
      expect(p.y).toBeLessThanOrEqual(BOX.bottom);
    }
  });
});

describe('describeWeightTrend', () => {
  it('describes rising, falling, flat, single and empty histories', () => {
    expect(
      describeWeightTrend('Bench Press', [
        { date: '2026-09-28', weightKg: 40 },
        { date: '2026-11-16', weightKg: 42.5 },
      ]),
    ).toBe('Bench Press weight rose from 40 kg to 42.5 kg over 2 sessions');
    expect(
      describeWeightTrend('Squat', [
        { date: '2026-09-28', weightKg: 70 },
        { date: '2026-11-16', weightKg: 65 },
      ]),
    ).toBe('Squat weight fell from 70 kg to 65 kg over 2 sessions');
    expect(
      describeWeightTrend('Squat', [
        { date: '2026-09-28', weightKg: 70 },
        { date: '2026-11-16', weightKg: 70 },
      ]),
    ).toBe('Squat weight stayed at 70 kg over 2 sessions');
    expect(describeWeightTrend('Squat', [{ date: '2026-11-16', weightKg: 70 }])).toBe(
      'Squat: 70 kg, one session',
    );
    expect(describeWeightTrend('Squat', [])).toBe('Squat: no weight recorded yet');
  });
});
