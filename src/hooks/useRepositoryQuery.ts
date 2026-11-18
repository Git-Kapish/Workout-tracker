import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { EntriesRepository } from '@/db/entries';
import { DbError } from '@/db/errors';

import { useRepository } from './useRepository';

export interface QueryState<T> {
  /** undefined until the first result for the current `key` arrives. */
  data: T | undefined;
  loading: boolean;
  error: DbError | null;
  reload: () => void;
}

interface Settled<T> {
  key: string;
  data?: T;
  error?: DbError;
}

/**
 * Runs `fetch` for `key`, and again after every repository write and whenever the screen
 * regains focus (safety net, ARCHITECTURE.md §5.2). Results for an old key are never shown,
 * and out-of-order responses are dropped.
 */
export function useRepositoryQuery<T>(
  key: string,
  fetch: (repository: EntriesRepository) => Promise<T>,
): QueryState<T> {
  const repository = useRepository();
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const latest = useRef(0);
  const fetchRef = useRef(fetch);

  // Declared before the load effect so it always sees the newest `fetch` closure.
  useEffect(() => {
    fetchRef.current = fetch;
  });

  const load = useCallback(() => {
    const request = ++latest.current;
    fetchRef.current(repository).then(
      (data) => {
        if (request === latest.current) setSettled({ key, data });
      },
      (e: unknown) => {
        if (request !== latest.current) return;
        setSettled({ key, error: e instanceof DbError ? e : new DbError('Query failed.', e) });
      },
    );
  }, [repository, key]);

  // Tabs stay mounted when you leave them. A screen you cannot see skips the refetch after a
  // write (it would be wasted work on a big database) and catches up when focus returns.
  // Starts true: a screen is only ever mounted by being focused, and tests without a navigator
  // never blur.
  const focused = useRef(true);

  useEffect(() => {
    load();
    return repository.subscribe(() => {
      if (focused.current) load();
    });
  }, [repository, load]);

  const mounted = useRef(false);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      // useFocusEffect also fires on mount, which the effect above already covers.
      if (mounted.current) load();
      mounted.current = true;
      return () => {
        focused.current = false;
      };
    }, [load]),
  );

  const ready = settled !== null && settled.key === key;
  return {
    data: ready ? settled.data : undefined,
    loading: !ready,
    error: ready ? (settled.error ?? null) : null,
    reload: load,
  };
}
