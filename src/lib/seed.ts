import { addDays } from './dates';
import type { DateString, Entry, NewEntry } from './types';

// Test data for checking performance on a real phone (dev builds only). Every seeded entry
// has an exercise name starting with SEED_PREFIX, so it can be found and removed without
// ever touching the user's own entries.

export const SEED_PREFIX = 'Seed ';
const EXERCISES = 40;
const SPAN_DAYS = 685; // about 22 months back from today

export function isSeedEntry(entry: Pick<Entry, 'exerciseName'>): boolean {
  return entry.exerciseName.startsWith(SEED_PREFIX);
}

/** Deterministic, valid entries spread over the last ~22 months ending `today`. */
export function seedEntries(count: number, today: DateString): NewEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    exerciseName: `${SEED_PREFIX}Exercise ${String(i % EXERCISES).padStart(2, '0')}`,
    sets: 3 + (i % 3),
    reps: 5 + (i % 8),
    weightKg: i % 7 === 0 ? null : 20 + (i % 60),
    date: addDays(today, -(i % SPAN_DAYS)),
  }));
}
