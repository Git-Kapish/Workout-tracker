import { useCallback, useRef, useState } from 'react';

import type { Entry, NewEntry } from '@/lib/types';

import { useRepository } from './useRepository';

/**
 * add / update / remove with a saving flag and a friendly error. Calls made while another
 * write is in flight are ignored (returning null), so a double tap can never create two
 * entries. The ref is the real guard: state is not updated between two taps in one frame.
 */
export function useEntryMutations() {
  const repository = useRepository();
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T>(failureMessage: string, operation: () => Promise<T>): Promise<T | null> => {
      if (busy.current) return null;
      busy.current = true;
      setSaving(true);
      setError(null);
      try {
        return await operation();
      } catch (e) {
        console.error(failureMessage, e);
        setError(failureMessage);
        return null;
      } finally {
        busy.current = false;
        setSaving(false);
      }
    },
    [],
  );

  const add = useCallback(
    (entry: NewEntry): Promise<Entry | null> =>
      run("Couldn't save. Try again.", () => repository.add(entry)),
    [repository, run],
  );
  const update = useCallback(
    (id: number, entry: NewEntry): Promise<Entry | null> =>
      run("Couldn't save. Try again.", () => repository.update(id, entry)),
    [repository, run],
  );
  /** Resolves true if the entry was deleted. */
  const remove = useCallback(
    async (id: number): Promise<boolean> =>
      (await run("Couldn't delete. Try again.", async () => {
        await repository.remove(id);
        return true;
      })) === true,
    [repository, run],
  );
  const clearError = useCallback(() => setError(null), []);

  return { add, update, remove, saving, error, clearError };
}
