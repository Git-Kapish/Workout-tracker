import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { RepositoryProvider } from '@/hooks/useRepository';
import { useTodayData } from '@/hooks/useTodayData';
import type { NewEntry } from '@/lib/types';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({ useFocusEffect: () => undefined }));

const e = (
  exerciseName: string,
  sets: number,
  reps: number,
  weightKg: number | null,
  date: string,
): NewEntry => ({ exerciseName, sets, reps, weightKg, date });

// PRD §7.5, with entries placed on the Sunday/Monday boundary between the two weeks.
const FIXTURE: NewEntry[] = [
  e('Bench Press', 3, 10, 40, '2026-11-09'), // last week: Monday
  e('Squat', 4, 8, 60, '2026-11-12'),
  e('Push-ups', 3, 15, null, '2026-11-15'), // last week: Sunday
  e('Bench Press', 3, 10, 42.5, '2026-11-16'), // this week: Monday
  e('Squat', 4, 8, 65, '2026-11-17'), // today (Tuesday)
  e('Push-ups', 3, 18, null, '2026-11-20'),
  e('Pull-ups', 3, 6, null, '2026-11-22'), // this week: Sunday
  e('Old', 1, 1, 10, '2026-11-08'), // two weeks ago: must be ignored
  e('Next', 1, 1, 10, '2026-11-23'), // next week: must be ignored
];

async function setup(seed: NewEntry[], today = '2026-11-17') {
  const db = createTestExecutor();
  await runMigrations(db);
  const repo = createEntriesRepository(db);
  for (const entry of seed) await repo.add(entry);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RepositoryProvider repository={repo}>{children}</RepositoryProvider>
  );
  const hook = await renderHook(() => useTodayData(today), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return { repo, ...hook };
}

describe('useTodayData', () => {
  it("returns only today's entries, in logging order", async () => {
    const { result } = await setup(FIXTURE);
    expect(result.current.entries.map((x) => x.exerciseName)).toEqual(['Squat']);
  });

  it('marks the days of this week that have entries (Mon to Sun)', async () => {
    const { result } = await setup(FIXTURE);
    expect(result.current.days.map((d) => d.date)).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ]);
    expect(result.current.days.map((d) => d.hasEntries)).toEqual([
      true,
      true,
      false,
      false,
      true,
      false,
      true,
    ]);
  });

  it('summarises this week and compares reps with last week (Sunday/Monday boundary)', async () => {
    const { result } = await setup(FIXTURE);
    expect(result.current.thisWeek).toEqual({
      exerciseCount: 4,
      totalSets: 13,
      totalReps: 134,
      totalVolumeKg: 3355,
    });
    expect(result.current.repsComparison).toEqual({
      current: 134,
      previous: 107,
      percent: 25,
      trend: 'up',
    });
  });

  it('reports no baseline on a first week, and zeros on an empty database', async () => {
    const first = await setup(FIXTURE.slice(3, 7));
    expect(first.result.current.repsComparison).toMatchObject({
      percent: null,
      trend: 'no-baseline',
    });

    const empty = await setup([]);
    expect(empty.result.current.entries).toEqual([]);
    expect(empty.result.current.thisWeek.totalReps).toBe(0);
    expect(empty.result.current.days.every((d) => !d.hasEntries)).toBe(true);
  });

  it('refreshes by itself when an entry is added', async () => {
    const { result, repo } = await setup(FIXTURE);
    await repo.add(e('Deadlift', 1, 5, 100, '2026-11-18'));
    await waitFor(() => expect(result.current.days[2]?.hasEntries).toBe(true));
    expect(result.current.thisWeek.exerciseCount).toBe(5);
  });
});
