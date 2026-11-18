import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ExercisesScreen from '../../app/(tabs)/exercises';
import ProgressScreen from '../../app/(tabs)/progress';
import WeekScreen from '../../app/(tabs)/week';
import { ErrorBoundary } from '../../app/_layout';
import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingState } from '@/components/LoadingState';
import { openDatabase, type Database } from '@/db/client';
import { createEntriesRepository, type EntriesRepository } from '@/db/entries';
import { DbError } from '@/db/errors';
import { runMigrations } from '@/db/migrations';
import { createSettingsRepository } from '@/db/settings';
import { DatabaseProvider } from '@/hooks/DatabaseProvider';
import { RepositoryProvider } from '@/hooks/useRepository';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({
  Stack: Object.assign(() => null, { Screen: () => null }),
  router: { push: jest.fn(), navigate: jest.fn() },
  useFocusEffect: () => undefined,
}));
jest.mock('@/hooks/useNow', () => ({
  useToday: () => '2026-11-17',
  useNow: () => new Date(2026, 10, 17, 18),
}));
jest.mock('@/db/client', () => ({ openDatabase: jest.fn() }));

describe('LoadingState', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('stays invisible at first (no flash for fast local queries), then appears', async () => {
    await render(<LoadingState delayMs={250} />);
    expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
    await act(async () => {
      jest.advanceTimersByTime(249);
    });
    expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
    await act(async () => {
      jest.advanceTimersByTime(2);
    });
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeOnTheScreen();
  });

  it('can appear immediately', async () => {
    await render(<LoadingState delayMs={0} />);
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  });

  it('is harmless if it is removed before the delay passes', async () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await render(<LoadingState delayMs={250} />);
    await screen.unmount();
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});

describe('ErrorFallback and the root ErrorBoundary', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('shows a friendly message and a way to try again', async () => {
    const onRetry = jest.fn();
    await render(<ErrorFallback onRetry={onRetry} />);
    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    expect(screen.getByText(/workouts are safe/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('the root boundary never shows the raw exception, but logs it for developers', async () => {
    const retry = jest.fn().mockResolvedValue(undefined);
    const error = new Error('SQLITE_CORRUPT: secret internal detail');
    await render(<ErrorBoundary error={error} retry={retry} />);
    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    expect(screen.queryByText(/SQLITE|secret|internal/)).not.toBeOnTheScreen();
    expect(console.error).toHaveBeenCalledWith('Unexpected error', error);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});

describe('DatabaseProvider', () => {
  async function realDatabase(): Promise<Database> {
    const db = createTestExecutor();
    await runMigrations(db);
    return { entries: createEntriesRepository(db), settings: createSettingsRepository(db) };
  }
  const renderProvider = () =>
    render(
      <DatabaseProvider
        loading={<Text>opening…</Text>}
        renderError={(error, retry) => (
          <>
            <Text>failed: {error.message}</Text>
            <ErrorFallback onRetry={retry} />
          </>
        )}
      >
        <Text>app is ready</Text>
      </DatabaseProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('shows the loading view, then the app', async () => {
    jest.mocked(openDatabase).mockResolvedValue(await realDatabase());
    await renderProvider();
    expect(await screen.findByText('app is ready')).toBeOnTheScreen();
  });

  it('shows a blocking error when opening fails, and recovers when retried', async () => {
    jest
      .mocked(openDatabase)
      .mockRejectedValueOnce(new DbError('Database error during migration.'))
      .mockResolvedValueOnce(await realDatabase());
    await renderProvider();

    expect(await screen.findByText('failed: Database error during migration.')).toBeOnTheScreen();
    expect(screen.queryByText('app is ready')).not.toBeOnTheScreen(); // never runs on a bad schema

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('app is ready')).toBeOnTheScreen();
    expect(openDatabase).toHaveBeenCalledTimes(2);
  });

  it('wraps an unexpected failure in a DbError for the error screen', async () => {
    jest.mocked(openDatabase).mockRejectedValue(new Error('weird'));
    await renderProvider();
    expect(await screen.findByText('failed: Could not open the database.')).toBeOnTheScreen();
  });
});

describe('screens show a loading state while their data has not arrived', () => {
  async function renderHanging(ui: ReactNode) {
    const db = createTestExecutor();
    await runMigrations(db);
    const real = createEntriesRepository(db);
    const never = new Promise<never>(() => undefined);
    const hanging: EntriesRepository = {
      ...real,
      getAll: () => never,
      getByDateRange: () => never,
    };
    await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        <RepositoryProvider repository={hanging}>{ui}</RepositoryProvider>
      </SafeAreaProvider>,
    );
    // The Week pager draws its pages only once it has a measured size, like on a device.
    const pager = screen.queryByTestId('week-pager-box');
    if (pager) {
      await fireEvent(pager, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 700 } },
      });
    }
  }

  it.each([
    ['Exercises', <ExercisesScreen key="e" />],
    ['Week', <WeekScreen key="w" />],
    ['Progress', <ProgressScreen key="p" />],
  ])('%s', async (_name, ui) => {
    await renderHanging(ui);
    expect(await screen.findByRole('progressbar', { name: 'Loading' })).toBeOnTheScreen();
    // ...and none of the empty or error messages, which would be wrong while loading
    expect(screen.queryByText('No exercises yet')).not.toBeOnTheScreen();
    expect(screen.queryByText('No data yet')).not.toBeOnTheScreen();
    expect(screen.queryByText('Nothing logged yet')).not.toBeOnTheScreen();
  });
});
