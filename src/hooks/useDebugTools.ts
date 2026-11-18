import { useCallback, useRef, useState } from 'react';

import { isSeedEntry, seedEntries } from '@/lib/seed';

import { useToday } from './useNow';
import { useRepository } from './useRepository';

/** Developer tools for checking performance on a device. Reachable only in dev builds. */
export function useDebugTools() {
  const repository = useRepository();
  const today = useToday();
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const run = useCallback(async (work: () => Promise<string>) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      setStatus(await work());
    } catch (error) {
      console.error('Debug tool failed', error);
      setStatus('Something failed. See the dev console.');
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);

  const count = useCallback(
    () =>
      run(async () => {
        const all = await repository.getAll();
        const seeded = all.filter(isSeedEntry).length;
        return `${all.length} entries (${seeded} seeded, ${all.length - seeded} yours)`;
      }),
    [repository, run],
  );

  const seed = useCallback(
    (amount: number) =>
      run(async () => {
        const started = Date.now();
        const entries = seedEntries(amount, today);
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          if (entry) await repository.add(entry);
          if (i % 250 === 249) setStatus(`Seeding… ${i + 1} / ${entries.length}`);
        }
        return `Seeded ${entries.length} entries in ${((Date.now() - started) / 1000).toFixed(1)} s`;
      }),
    [repository, today, run],
  );

  /** Removes only the seeded entries; yours are never touched. */
  const clearSeed = useCallback(
    () =>
      run(async () => {
        const seeded = (await repository.getAll()).filter(isSeedEntry);
        for (let i = 0; i < seeded.length; i++) {
          const entry = seeded[i];
          if (entry) await repository.remove(entry.id);
          if (i % 250 === 249) setStatus(`Removing… ${i + 1} / ${seeded.length}`);
        }
        return `Removed ${seeded.length} seeded entries`;
      }),
    [repository, run],
  );

  return { busy, status, count, seed, clearSeed };
}
