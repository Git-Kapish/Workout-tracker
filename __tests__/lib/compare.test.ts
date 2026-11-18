import { compareWeeks, percentChange, trend } from '@/lib/compare';
import { groupByWeek, summarize } from '@/lib/metrics';
import type { Entry } from '@/lib/types';

describe('percentChange', () => {
  it('returns null when previous is 0 (never NaN or Infinity)', () => {
    expect(percentChange(5, 0)).toBeNull();
    expect(percentChange(0, 0)).toBeNull();
  });

  it('handles increase, decrease and no change', () => {
    expect(percentChange(112, 100)).toBe(12);
    expect(percentChange(95, 100)).toBe(-5);
    expect(percentChange(100, 100)).toBe(0);
  });

  it('is -100 when this week is empty but last week was not', () => {
    expect(percentChange(0, 8)).toBe(-100);
  });

  it('rounds half away from zero', () => {
    expect(percentChange(9, 8)).toBe(13); // 12.5 -> 13
    expect(percentChange(7, 8)).toBe(-13); // -12.5 -> -13
    expect(percentChange(1005, 1000)).toBe(1); // 0.5 -> 1
    expect(percentChange(995, 1000)).toBe(-1); // -0.5 -> -1
  });

  it('never returns negative zero', () => {
    expect(Object.is(percentChange(10002, 10000), 0)).toBe(true); // 0.02 -> 0
    expect(Object.is(percentChange(9998, 10000), 0)).toBe(true); // -0.02 -> 0 (not -0)
  });

  it('matches the PRD worked-example rounding', () => {
    expect(percentChange(4, 3)).toBe(33);
    expect(percentChange(13, 10)).toBe(30);
    expect(percentChange(134, 107)).toBe(25);
    expect(percentChange(3355, 3120)).toBe(8);
  });
});

describe('trend', () => {
  it('covers all four outcomes', () => {
    expect(trend(5, 3)).toBe('up');
    expect(trend(3, 5)).toBe('down');
    expect(trend(4, 4)).toBe('same');
    expect(trend(4, 0)).toBe('no-baseline');
    expect(trend(0, 0)).toBe('no-baseline');
  });
});

// PRD §7.5 worked example, built from real entries so it exercises the whole chain.
describe('PRD §7.5 worked example', () => {
  const e = (
    id: number,
    name: string,
    sets: number,
    reps: number,
    kg: number | null,
    date: string,
  ): Entry => ({
    id,
    exerciseName: name,
    sets,
    reps,
    weightKg: kg,
    date,
  });

  const entries: Entry[] = [
    // last week: Mon Nov 9 - Sun Nov 15
    e(1, 'Bench Press', 3, 10, 40, '2026-11-09'),
    e(2, 'Squat', 4, 8, 60, '2026-11-11'),
    e(3, 'Push-ups', 3, 15, null, '2026-11-15'),
    // this week: Mon Nov 16 - Sun Nov 22
    e(4, 'Bench Press', 3, 10, 42.5, '2026-11-16'),
    e(5, 'Squat', 4, 8, 65, '2026-11-17'),
    e(6, 'Push-ups', 3, 18, null, '2026-11-20'),
    e(7, 'Pull-ups', 3, 6, null, '2026-11-22'),
  ];

  const weeks = groupByWeek(entries);
  const last = summarize(weeks['2026-11-09']);
  const current = summarize(weeks['2026-11-16']);

  it('summarizes each week', () => {
    expect(last).toEqual({ exerciseCount: 3, totalSets: 10, totalReps: 107, totalVolumeKg: 3120 });
    expect(current).toEqual({
      exerciseCount: 4,
      totalSets: 13,
      totalReps: 134,
      totalVolumeKg: 3355,
    });
  });

  it('compares: +33 / +30 / +25 / +8 percent, all up', () => {
    const c = compareWeeks(current, last);
    expect(c.exercises).toEqual({ current: 4, previous: 3, percent: 33, trend: 'up' });
    expect(c.sets).toEqual({ current: 13, previous: 10, percent: 30, trend: 'up' });
    expect(c.reps).toEqual({ current: 134, previous: 107, percent: 25, trend: 'up' });
    expect(c.volume).toEqual({ current: 3355, previous: 3120, percent: 8, trend: 'up' });
  });

  it('first ever week has no baseline on any metric', () => {
    const c = compareWeeks(last, summarize([]));
    for (const m of [c.exercises, c.sets, c.reps, c.volume]) {
      expect(m.percent).toBeNull();
      expect(m.trend).toBe('no-baseline');
    }
  });

  it('an empty week after a busy one is a 100% drop', () => {
    const c = compareWeeks(summarize([]), last);
    expect(c.reps).toEqual({ current: 0, previous: 107, percent: -100, trend: 'down' });
  });
});
