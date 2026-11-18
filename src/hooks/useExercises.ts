import { useMemo } from 'react';

import type { DbError } from '@/db/errors';
import { weightSeries, type WeightPoint } from '@/lib/chart';
import { summarizeExercises, type ExerciseSummary } from '@/lib/exercises';
import { personalBests, type PersonalBests } from '@/lib/metrics';
import type { Entry } from '@/lib/types';

import { useRepositoryQuery } from './useRepositoryQuery';

export interface ExerciseListData {
  loading: boolean;
  error: DbError | null;
  /** Most recently done first. */
  exercises: ExerciseSummary[];
  reload: () => void;
}

/** Every exercise ever logged, aggregated from the entries (ADR-004: aggregates live in src/lib). */
export function useExerciseList(): ExerciseListData {
  const { data, loading, error, reload } = useRepositoryQuery('exercise-list', (r) => r.getAll());
  return useMemo(
    () => ({ loading, error, exercises: summarizeExercises(data ?? []), reload }),
    [data, loading, error, reload],
  );
}

export interface ExerciseHistoryData {
  loading: boolean;
  error: DbError | null;
  /** Newest first. */
  entries: Entry[];
  /** The spelling used most recently, falling back to the requested name. */
  displayName: string;
  bests: PersonalBests;
  /** Oldest first, for the line chart. */
  series: WeightPoint[];
  reload: () => void;
}

export function useExerciseHistory(name: string): ExerciseHistoryData {
  const { data, loading, error, reload } = useRepositoryQuery(
    `exercise:${name.toLowerCase()}`,
    (r) => r.getByExercise(name),
  );
  return useMemo(() => {
    const entries = data ?? [];
    return {
      loading,
      error,
      entries,
      displayName: entries[0]?.exerciseName ?? name,
      bests: personalBests(entries),
      series: weightSeries(entries),
      reload,
    };
  }, [data, name, loading, error, reload]);
}
