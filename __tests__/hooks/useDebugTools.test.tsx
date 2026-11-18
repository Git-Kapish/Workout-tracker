import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { useDebugTools } from '@/hooks/useDebugTools';
import { RepositoryProvider } from '@/hooks/useRepository';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('@/hooks/useNow', () => ({ useToday: () => '2026-11-17' }));

async function setup() {
  const db = createTestExecutor();
  await runMigrations(db);
  const repo = createEntriesRepository(db);
  // the user's own, real entries
  await repo.add({ exerciseName: 'Squat', sets: 4, reps: 8, weightKg: 65, date: '2026-11-16' });
  await repo.add({
    exerciseName: 'Seeded cabbage',
    sets: 1,
    reps: 1,
    weightKg: null,
    date: '2026-11-16',
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RepositoryProvider repository={repo}>{children}</RepositoryProvider>
  );
  const hook = await renderHook(() => useDebugTools(), { wrapper });
  return { repo, ...hook };
}

describe('useDebugTools', () => {
  it('seeds the requested amount and reports it', async () => {
    const { repo, result } = await setup();
    await act(async () => result.current.seed(120));
    expect(await repo.getAll()).toHaveLength(122);
    expect(result.current.status).toMatch(/^Seeded 120 entries in /);
    expect(result.current.busy).toBe(false);
  });

  it('removes only seeded entries and leaves the real ones untouched', async () => {
    const { repo, result } = await setup();
    await act(async () => result.current.seed(60));
    await act(async () => result.current.clearSeed());

    const left = (await repo.getAll()).map((e) => e.exerciseName).sort();
    expect(left).toEqual(['Seeded cabbage', 'Squat']);
    expect(result.current.status).toBe('Removed 60 seeded entries');
  });

  it('counts entries, separating seeded from the real ones', async () => {
    const { result } = await setup();
    await act(async () => result.current.seed(10));
    await act(async () => result.current.count());
    expect(result.current.status).toBe('12 entries (10 seeded, 2 yours)');
  });

  it('ignores a second request while one is running', async () => {
    const { repo, result } = await setup();
    await act(async () => {
      void result.current.seed(40);
      void result.current.seed(40); // double tap
    });
    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(await repo.getAll()).toHaveLength(42); // 2 real + 40, not 80
  });

  it('reports a failure without crashing', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const db = createTestExecutor();
    await runMigrations(db);
    const repo = createEntriesRepository(db);
    const broken = {
      ...repo,
      add: async () => {
        throw new Error('nope');
      },
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RepositoryProvider repository={broken}>{children}</RepositoryProvider>
    );
    const { result } = await renderHook(() => useDebugTools(), { wrapper });
    await act(async () => result.current.seed(3));
    expect(result.current.status).toBe('Something failed. See the dev console.');
    expect(result.current.busy).toBe(false);
    spy.mockRestore();
  });
});
