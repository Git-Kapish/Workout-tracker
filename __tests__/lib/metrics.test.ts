import { groupByDay, groupByWeek, summarize } from '@/lib/metrics';
import type { Entry } from '@/lib/types';

const entry = (over: Partial<Entry>): Entry => ({
  id: 1,
  exerciseName: 'Bench Press',
  sets: 3,
  reps: 10,
  weightKg: 40,
  date: '2026-11-16',
  ...over,
});

describe('summarize', () => {
  it('returns all zeros for an empty list', () => {
    expect(summarize([])).toEqual({
      totalSets: 0,
      totalReps: 0,
      totalVolumeKg: 0,
      exerciseCount: 0,
    });
  });

  it('sums a single entry', () => {
    expect(summarize([entry({})])).toEqual({
      totalSets: 3,
      totalReps: 30,
      totalVolumeKg: 1200,
      exerciseCount: 1,
    });
  });

  it('counts reps but adds no volume for a blank weight', () => {
    const s = summarize([entry({ sets: 3, reps: 15, weightKg: null })]);
    expect(s.totalReps).toBe(45);
    expect(s.totalVolumeKg).toBe(0);
  });

  it('treats a 0 kg weight like a blank one for volume', () => {
    expect(summarize([entry({ weightKg: 0 })]).totalVolumeKg).toBe(0);
  });

  it('handles decimal weights without float noise', () => {
    // 3 x 10 x 42.5 = 1275 ; 4 x 8 x 22.5 = 720
    expect(
      summarize([entry({ weightKg: 42.5 }), entry({ sets: 4, reps: 8, weightKg: 22.5 })])
        .totalVolumeKg,
    ).toBe(1995);
    // classic 0.1 + 0.2 style noise: 1 x 1 x 0.1 + 1 x 1 x 0.2 must be exactly 0.3
    const noisy = summarize([
      entry({ sets: 1, reps: 1, weightKg: 0.1 }),
      entry({ sets: 1, reps: 1, weightKg: 0.2 }),
    ]);
    expect(noisy.totalVolumeKg).toBe(0.3);
  });

  it('sums many entries', () => {
    const many = Array.from({ length: 1000 }, (_, i) =>
      entry({ id: i, sets: 2, reps: 5, weightKg: 10 }),
    );
    expect(summarize(many)).toEqual({
      totalSets: 2000,
      totalReps: 10000,
      totalVolumeKg: 100000,
      exerciseCount: 1000,
    });
  });
});

describe('groupByWeek / groupByDay', () => {
  const entries = [
    entry({ id: 1, date: '2026-11-22' }), // Sunday -> week of Nov 16
    entry({ id: 2, date: '2026-11-23' }), // Monday -> week of Nov 23
    entry({ id: 3, date: '2026-11-16' }),
    entry({ id: 4, date: '2027-01-01' }), // week of Dec 28
  ];

  it('groups by the Monday of the week, including Sunday/Monday and year boundaries', () => {
    const g = groupByWeek(entries);
    expect(Object.keys(g).sort()).toEqual(['2026-11-16', '2026-11-23', '2026-12-28']);
    expect(g['2026-11-16'].map((e) => e.id)).toEqual([1, 3]);
    expect(g['2026-11-23'].map((e) => e.id)).toEqual([2]);
    expect(g['2026-12-28'].map((e) => e.id)).toEqual([4]);
  });

  it('groups by calendar day', () => {
    const g = groupByDay(entries);
    expect(Object.keys(g)).toHaveLength(4);
    expect(g['2026-11-16'].map((e) => e.id)).toEqual([3]);
  });

  it('returns empty objects for no entries', () => {
    expect(groupByWeek([])).toEqual({});
    expect(groupByDay([])).toEqual({});
  });
});
