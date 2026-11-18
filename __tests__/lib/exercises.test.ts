import {
  bestOf,
  findExercise,
  sameExercise,
  searchExercises,
  suggestExercises,
  summarizeExercises,
} from '@/lib/exercises';
import type { Entry } from '@/lib/types';

let nextId = 0;
const entry = (
  exerciseName: string,
  date: string,
  sets: number,
  reps: number,
  weightKg: number | null,
): Entry => ({ id: ++nextId, exerciseName, date, sets, reps, weightKg });

describe('sameExercise', () => {
  it('ignores case and extra whitespace', () => {
    expect(sameExercise('Bench Press', 'bench   press ')).toBe(true);
    expect(sameExercise('Squat', 'Squats')).toBe(false);
  });
});

describe('suggestExercises', () => {
  const names = ['Pull-ups', 'Squat', 'Bench Press', 'Front Squat', 'Incline Bench'];

  it('returns the most recent names for an empty query', () => {
    expect(suggestExercises(names, '', 3)).toEqual(['Pull-ups', 'Squat', 'Bench Press']);
    expect(suggestExercises(names, '   ', 2)).toEqual(['Pull-ups', 'Squat']);
  });

  it('puts prefix matches before contains matches, case-insensitively', () => {
    expect(suggestExercises(names, 'SQU')).toEqual(['Squat', 'Front Squat']);
    expect(suggestExercises(names, 'bench')).toEqual(['Bench Press', 'Incline Bench']);
  });

  it('returns nothing when nothing matches, and respects the limit', () => {
    expect(suggestExercises(names, 'deadlift')).toEqual([]);
    expect(suggestExercises(names, 'e', 2)).toHaveLength(2);
  });
});

describe('summarizeExercises (the Exercises list, docs/design/screens/06-exercises.png)', () => {
  const entries = [
    entry('Bench Press', '2026-11-09', 3, 10, 40),
    entry('Bench Press', '2026-11-16', 3, 10, 42.5),
    entry('Squat', '2026-11-17', 4, 8, 65),
    entry('Pull-ups', '2026-11-17', 3, 6, null),
    entry('Deadlift', '2026-11-13', 1, 5, 90),
  ];

  it('gives one row per exercise with last date, entry count and records', () => {
    const rows = summarizeExercises(entries);
    const bench = rows.find((r) => r.name === 'Bench Press');
    expect(bench).toMatchObject({ lastDate: '2026-11-16', entryCount: 2 });
    expect(bench?.bests).toEqual({ maxWeightKg: 42.5, bestVolumeKg: 1275, maxRepsPerSet: 10 });
  });

  it('orders by most recently done, ties alphabetical (case-insensitive)', () => {
    expect(summarizeExercises(entries).map((r) => r.name)).toEqual([
      'Pull-ups', // Nov 17, alphabetical before Squat
      'Squat', // Nov 17
      'Bench Press', // Nov 16
      'Deadlift', // Nov 13
    ]);
  });

  it('treats names differing only by case or spacing as one exercise, showing the latest spelling', () => {
    const rows = summarizeExercises([
      entry('bench press', '2026-11-09', 3, 10, 40),
      entry('Bench  Press', '2026-11-16', 3, 10, 42.5),
      entry('BENCH PRESS', '2026-11-02', 3, 10, 35),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: 'Bench  Press', entryCount: 3, lastDate: '2026-11-16' });
    expect(rows[0]?.bests.maxWeightKg).toBe(42.5);
  });

  it('prefers the later entry when two spellings share the last date', () => {
    const rows = summarizeExercises([
      entry('squat', '2026-11-16', 3, 5, 60),
      entry('Squat', '2026-11-16', 3, 5, 65),
    ]);
    expect(rows[0]?.name).toBe('Squat');
  });

  it('is empty for no entries', () => {
    expect(summarizeExercises([])).toEqual([]);
  });
});

describe('searchExercises', () => {
  const items = [{ name: 'Bench Press' }, { name: 'Squat' }, { name: 'Incline Bench' }];

  it('filters case-insensitively by "contains", keeping the order', () => {
    expect(searchExercises(items, 'BENCH').map((i) => i.name)).toEqual([
      'Bench Press',
      'Incline Bench',
    ]);
    expect(searchExercises(items, '  sq ').map((i) => i.name)).toEqual(['Squat']);
  });

  it('returns everything for an empty query and nothing for no match', () => {
    expect(searchExercises(items, '')).toHaveLength(3);
    expect(searchExercises(items, '   ')).toHaveLength(3);
    expect(searchExercises(items, 'zzz')).toEqual([]);
  });
});

describe('bestOf', () => {
  it('prefers the heaviest weight, then falls back to most reps (bodyweight)', () => {
    expect(bestOf({ maxWeightKg: 42.5, bestVolumeKg: 1275, maxRepsPerSet: 10 })).toEqual({
      kind: 'weight',
      value: 42.5,
    });
    expect(bestOf({ maxWeightKg: null, bestVolumeKg: null, maxRepsPerSet: 6 })).toEqual({
      kind: 'reps',
      value: 6,
    });
    expect(bestOf({ maxWeightKg: null, bestVolumeKg: null, maxRepsPerSet: null })).toBeNull();
  });
});

describe('findExercise', () => {
  it('returns the stored spelling of a case-variant, or undefined', () => {
    expect(findExercise(['Bench Press'], ' bench press')).toBe('Bench Press');
    expect(findExercise(['Bench Press'], 'Squat')).toBeUndefined();
  });
});
