import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { RepositoryProvider } from '@/hooks/useRepository';
import { useWeek } from '@/hooks/useWeek';
import type { NewEntry } from '@/lib/types';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({ useFocusEffect: () => undefined }));

const entry = (
  exerciseName: string,
  date: string,
  sets = 3,
  reps = 10,
  kg: number | null = 40,
): NewEntry => ({
  exerciseName,
  date,
  sets,
  reps,
  weightKg: kg,
});

async function setup(seed: NewEntry[], initial: string) {
  const db = createTestExecutor();
  await runMigrations(db);
  const repo = createEntriesRepository(db);
  for (const e of seed) await repo.add(e);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RepositoryProvider repository={repo}>{children}</RepositoryProvider>
  );
  const hook = await renderHook((date: string) => useWeek(date), {
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

const names = (days: { entries: { exerciseName: string }[] }[]) =>
  days.map((d) => d.entries.map((e) => e.exerciseName));

describe('useWeek: entries land on the right day of the right week', () => {
  it('shows Monday to Sunday and ignores the neighbouring Sunday and Monday', async () => {
    const { result } = await setup(
      [
        entry('PrevSunday', '2026-11-15'),
        entry('Mon', '2026-11-16'),
        entry('Sun', '2026-11-22'),
        entry('NextMonday', '2026-11-23'),
      ],
      '2026-11-19', // a Thursday in the middle of the week
    );
    expect(result.current.days.map((d) => d.date)).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ]);
    expect(names(result.current.days)).toEqual([['Mon'], [], [], [], [], [], ['Sun']]);
    expect(result.current.days.map((d) => d.hasEntries)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
  });

  it('puts a Sunday in the week that began the previous Monday, and Monday in the next one', async () => {
    const { result, goTo } = await setup(
      [entry('Sun', '2026-11-22'), entry('Mon', '2026-11-23')],
      '2026-11-22', // selecting the Sunday itself shows the week ending on it
    );
    expect(result.current.days[0]?.date).toBe('2026-11-16');
    expect(names(result.current.days)[6]).toEqual(['Sun']);
    expect(result.current.summary.exerciseCount).toBe(1);

    await goTo('2026-11-23');
    expect(result.current.days[0]?.date).toBe('2026-11-23');
    expect(names(result.current.days)[0]).toEqual(['Mon']);
    expect(result.current.summary.exerciseCount).toBe(1);
  });

  it('handles a week crossing a month boundary (Mon Mar 30 - Sun Apr 5, 2026)', async () => {
    const { result } = await setup(
      [
        entry('Before', '2026-03-29'),
        entry('Mar30', '2026-03-30'),
        entry('Mar31', '2026-03-31'),
        entry('Apr1', '2026-04-01'),
        entry('Apr5', '2026-04-05'),
        entry('After', '2026-04-06'),
      ],
      '2026-04-02',
    );
    expect(result.current.days.map((d) => d.date)).toEqual([
      '2026-03-30',
      '2026-03-31',
      '2026-04-01',
      '2026-04-02',
      '2026-04-03',
      '2026-04-04',
      '2026-04-05',
    ]);
    expect(names(result.current.days)).toEqual([
      ['Mar30'],
      ['Mar31'],
      ['Apr1'],
      [],
      [],
      [],
      ['Apr5'],
    ]);
  });

  it('handles a week crossing New Year (Mon Dec 28 - Sun Jan 3)', async () => {
    const { result } = await setup(
      [
        entry('Dec28', '2026-12-28'),
        entry('Dec31', '2026-12-31'),
        entry('Jan1', '2027-01-01'),
        entry('Jan3', '2027-01-03'),
        entry('Jan4', '2027-01-04'),
      ],
      '2027-01-02',
    );
    expect(result.current.days[0]?.date).toBe('2026-12-28');
    expect(result.current.days[6]?.date).toBe('2027-01-03');
    expect(names(result.current.days)).toEqual([
      ['Dec28'],
      [],
      [],
      ['Dec31'],
      ['Jan1'],
      [],
      ['Jan3'],
    ]);
  });

  it('shows a leap day in the right place (Mon Feb 28 - Sun Mar 5, 2028)', async () => {
    const { result } = await setup([entry('Leap', '2028-02-29')], '2028-03-02');
    expect(result.current.days.map((d) => d.date)).toEqual([
      '2028-02-28',
      '2028-02-29',
      '2028-03-01',
      '2028-03-02',
      '2028-03-03',
      '2028-03-04',
      '2028-03-05',
    ]);
    expect(names(result.current.days)[1]).toEqual(['Leap']);
  });
});

describe('useWeek: totals and navigation', () => {
  it('computes per-day and per-week totals with src/lib (PRD §7.5 week)', async () => {
    const { result } = await setup(
      [
        entry('Bench Press', '2026-11-16', 3, 10, 42.5),
        entry('Squat', '2026-11-17', 4, 8, 65),
        entry('Pull-ups', '2026-11-17', 3, 6, null),
        entry('Push-ups', '2026-11-20', 3, 18, null),
      ],
      '2026-11-17',
    );
    expect(result.current.days[1]?.summary).toEqual({
      exerciseCount: 2,
      totalSets: 7,
      totalReps: 50,
      totalVolumeKg: 2080,
    });
    expect(result.current.summary).toEqual({
      exerciseCount: 4,
      totalSets: 13,
      totalReps: 134,
      totalVolumeKg: 3355,
    });
    expect(result.current.days[2]?.summary.exerciseCount).toBe(0);
  });

  it('is stable when navigating several weeks back and forth', async () => {
    const { result, goTo } = await setup(
      [entry('A', '2026-11-02'), entry('B', '2026-11-09'), entry('C', '2026-11-16')],
      '2026-11-17',
    );
    const seen: number[] = [];
    for (const date of [
      '2026-11-10',
      '2026-11-03',
      '2026-11-10',
      '2026-11-17',
      '2026-11-24',
      '2026-11-17',
    ]) {
      await goTo(date);
      seen.push(result.current.summary.exerciseCount);
    }
    expect(seen).toEqual([1, 1, 1, 1, 0, 1]);
  });

  it('never shows data from the previously selected week while a new one loads', async () => {
    const { result, goTo } = await setup([entry('A', '2026-11-16')], '2026-11-17');
    expect(result.current.summary.exerciseCount).toBe(1);
    await goTo('2026-11-24');
    expect(result.current.summary.exerciseCount).toBe(0);
  });

  it('refreshes when an entry is added to the displayed week', async () => {
    const { result, repo } = await setup([], '2026-11-17');
    expect(result.current.summary.exerciseCount).toBe(0);
    await repo.add(entry('New', '2026-11-18'));
    await waitFor(() => expect(result.current.days[2]?.hasEntries).toBe(true));
  });

  it('moves an entry to another week when its date is edited', async () => {
    const { result, repo } = await setup([entry('Move me', '2026-11-17')], '2026-11-17');
    const [stored] = await repo.getAll();
    if (!stored) throw new Error('seed missing');
    await repo.update(stored.id, { ...entry('Move me', '2026-11-25') });
    await waitFor(() => expect(result.current.summary.exerciseCount).toBe(0));
  });
});
