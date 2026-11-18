import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { RepositoryProvider } from '@/hooks/useRepository';
import { useRepositoryQuery } from '@/hooks/useRepositoryQuery';
import { createTestExecutor } from '../helpers/sqliteExecutor';

// A controllable stand-in for the navigator: blur() runs the focus effect's cleanup and
// focus() runs it again, exactly like switching away from a tab and back.
const mockFocus = { focus: () => undefined, blur: () => undefined };
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(() => {
        let cleanup = callback();
        mockFocus.blur = () => {
          cleanup?.();
          cleanup = undefined;
        };
        mockFocus.focus = () => {
          cleanup?.();
          cleanup = callback();
        };
        return () => cleanup?.();
      }, [callback]);
    },
  };
});

async function setup() {
  const db = createTestExecutor();
  await runMigrations(db);
  const repo = createEntriesRepository(db);
  const fetches = jest.fn((r: typeof repo) => r.getAll());
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RepositoryProvider repository={repo}>{children}</RepositoryProvider>
  );
  const hook = await renderHook(() => useRepositoryQuery('all', fetches), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  const add = (name: string) =>
    repo.add({ exerciseName: name, sets: 1, reps: 1, weightKg: null, date: '2026-11-17' });
  return { repo, fetches, add, ...hook };
}

describe('useRepositoryQuery: focus-aware refetching', () => {
  it('loads once on mount (the focus effect does not fetch a second time)', async () => {
    const { fetches } = await setup();
    expect(fetches).toHaveBeenCalledTimes(1);
  });

  it('refetches after a write while the screen is focused', async () => {
    const { fetches, add, result } = await setup();
    await add('A');
    await waitFor(() => expect(fetches).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });

  it('does not refetch after writes while the screen is not focused', async () => {
    const { fetches, add } = await setup();
    await act(async () => mockFocus.blur());
    await add('A');
    await add('B');
    await add('C');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetches).toHaveBeenCalledTimes(1); // three writes, zero wasted refetches
  });

  it('catches up with everything it missed as soon as focus returns', async () => {
    const { fetches, add, result } = await setup();
    await act(async () => mockFocus.blur());
    await add('A');
    await add('B');
    expect(result.current.data).toHaveLength(0); // stale, but nobody is looking at it

    await act(async () => mockFocus.focus());
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    expect(fetches).toHaveBeenCalledTimes(2);
  });

  it('keeps refreshing on writes after it has been focused again', async () => {
    const { fetches, add, result } = await setup();
    await act(async () => mockFocus.blur());
    await act(async () => mockFocus.focus());
    await waitFor(() => expect(fetches).toHaveBeenCalledTimes(2));
    await add('A');
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });
});
