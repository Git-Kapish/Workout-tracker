import { findExercise, sameExercise, suggestExercises } from '@/lib/exercises';

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

describe('findExercise', () => {
  it('returns the stored spelling of a case-variant, or undefined', () => {
    expect(findExercise(['Bench Press'], ' bench press')).toBe('Bench Press');
    expect(findExercise(['Bench Press'], 'Squat')).toBeUndefined();
  });
});
