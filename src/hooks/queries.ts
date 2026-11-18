import type { Entry, DateString } from '@/lib/types';

import { useRepositoryQuery, type QueryState } from './useRepositoryQuery';

const NO_NAMES: string[] = [];

/** Autocomplete source: one spelling per exercise, most recently used first. */
export function useExerciseNames(): string[] {
  return useRepositoryQuery('exercise-names', (r) => r.distinctExerciseNames()).data ?? NO_NAMES;
}

export function useEntriesForDate(date: DateString): QueryState<Entry[]> {
  return useRepositoryQuery(`day:${date}`, (r) => r.getByDateRange(date, date));
}

/** `null` data = the entry no longer exists; undefined = still loading. */
export function useEntry(id: number | null): QueryState<Entry | null> {
  return useRepositoryQuery(`entry:${id}`, async (r) => (id === null ? null : r.getById(id)));
}
