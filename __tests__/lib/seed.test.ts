import { isValidDateString } from '@/lib/dates';
import { SEED_PREFIX, isSeedEntry, seedEntries } from '@/lib/seed';
import { validateEntryInput } from '@/lib/validation';

describe('seedEntries', () => {
  const entries = seedEntries(5000, '2026-11-17');

  it('creates exactly the requested number, deterministically', () => {
    expect(entries).toHaveLength(5000);
    expect(seedEntries(5000, '2026-11-17')).toEqual(entries);
    expect(seedEntries(0, '2026-11-17')).toEqual([]);
  });

  it('every entry passes the app validation (so it is a realistic entry)', () => {
    for (const e of entries) {
      const result = validateEntryInput({
        exerciseName: e.exerciseName,
        sets: String(e.sets),
        reps: String(e.reps),
        weight: e.weightKg === null ? '' : String(e.weightKg),
        date: e.date,
      });
      expect(result.ok).toBe(true);
    }
  });

  it('spreads dates over about 22 months ending today, never in the future', () => {
    const dates = entries.map((e) => e.date);
    expect(dates.every(isValidDateString)).toBe(true);
    expect(dates.every((d) => d <= '2026-11-17')).toBe(true);
    expect(dates.reduce((a, b) => (a < b ? a : b))).toBe('2025-01-02');
    expect(dates.reduce((a, b) => (a > b ? a : b))).toBe('2026-11-17');
  });

  it('uses 40 exercises, a mix of weighted and bodyweight', () => {
    expect(new Set(entries.map((e) => e.exerciseName)).size).toBe(40);
    expect(entries.some((e) => e.weightKg === null)).toBe(true);
    expect(entries.some((e) => e.weightKg !== null)).toBe(true);
  });

  it('marks every entry as seeded so it can never be confused with real data', () => {
    expect(entries.every((e) => e.exerciseName.startsWith(SEED_PREFIX))).toBe(true);
    expect(entries.every(isSeedEntry)).toBe(true);
    expect(isSeedEntry({ exerciseName: 'Squat' })).toBe(false);
    expect(isSeedEntry({ exerciseName: 'Seeded cabbage' })).toBe(false); // needs "Seed " with the space
    expect(isSeedEntry({ exerciseName: 'My Seed Exercise' })).toBe(false);
  });
});
