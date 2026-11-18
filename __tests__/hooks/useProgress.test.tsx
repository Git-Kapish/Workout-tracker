import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { RepositoryProvider } from '@/hooks/useRepository';
import { useProgress } from '@/hooks/useProgress';
import type { NewEntry } from '@/lib/types';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({ useFocusEffect: () => undefined }));

const e = (date: string, sets: number, reps: number, kg: number | null): NewEntry => ({
  exerciseName: 'X',
  date,
  sets,
  reps,
  weightKg: kg,
});

async function setup(seed: NewEntry[], initial: string) {
  const db = createTestExecutor();
  await runMigrations(db);
  const repo = createEntriesRepository(db);
  for (const entry of seed) await repo.add(entry);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RepositoryProvider repository={repo}>{children}</RepositoryProvider>
  );
  const hook = await renderHook((date: string) => useProgress(date), {
    wrapper,
    initialProps: initial,
  });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  const goTo = async (date: string) => {
    await hook.rerender(date);
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
  };
  return { repo, goTo, ...hook };
}

describe('useProgress', () => {
  it('builds 8 weeks ending with the selected week and compares it with the previous one', async () => {
    const { result } = await setup(
      [e('2026-11-09', 3, 10, 40), e('2026-11-16', 3, 10, 42.5), e('2026-11-17', 4, 8, 65)],
      '2026-11-19',
    );
    expect(result.current.series).toHaveLength(8);
    expect(result.current.series[7]?.weekStart).toBe('2026-11-16');
    expect(result.current.series[6]?.weekStart).toBe('2026-11-09');
    expect(result.current.current.totalReps).toBe(62);
    expect(result.current.previous.totalReps).toBe(30);
    expect(result.current.comparison.reps).toEqual({
      current: 62,
      previous: 30,
      percent: 107,
      trend: 'up',
    });
    expect(result.current.isEmpty).toBe(false);
  });

  it('is empty, with no baseline and no NaN, when nothing is logged', async () => {
    const { result } = await setup([], '2026-11-17');
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.comparison.reps).toEqual({
      current: 0,
      previous: 0,
      percent: null,
      trend: 'no-baseline',
    });
  });

  it('puts Sunday and Monday entries in different weeks when comparing', async () => {
    const { result } = await setup(
      [e('2026-11-22', 1, 10, null), e('2026-11-23', 1, 20, null)],
      '2026-11-24',
    );
    expect(result.current.current.totalReps).toBe(20); // week of Nov 23
    expect(result.current.previous.totalReps).toBe(10); // week of Nov 16 (Sunday Nov 22)
  });

  it('crosses New Year', async () => {
    const { result } = await setup(
      [e('2026-12-31', 1, 10, null), e('2027-01-05', 1, 15, null)],
      '2027-01-05',
    );
    expect(result.current.series.some((p) => p.weekStart === '2026-12-28')).toBe(true);
    expect(result.current.current.totalReps).toBe(15); // week of Jan 4
    expect(result.current.previous.totalReps).toBe(10); // week of Dec 28
  });

  it('moves with the selected week and never shows stale data while loading', async () => {
    const { result, goTo } = await setup(
      [e('2026-11-16', 1, 50, null), e('2026-11-09', 1, 40, null)],
      '2026-11-17',
    );
    expect(result.current.current.totalReps).toBe(50);
    await goTo('2026-11-10');
    expect(result.current.current.totalReps).toBe(40);
    expect(result.current.series[7]?.weekStart).toBe('2026-11-09');
    await goTo('2026-11-17');
    expect(result.current.current.totalReps).toBe(50);
  });

  it('refreshes when an entry is added', async () => {
    const { result, repo } = await setup([], '2026-11-17');
    await repo.add(e('2026-11-17', 2, 5, null));
    await waitFor(() => expect(result.current.current.totalReps).toBe(10));
    expect(result.current.isEmpty).toBe(false);
  });
});
