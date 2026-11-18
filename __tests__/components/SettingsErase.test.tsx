import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Alert, type AlertButton } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SettingsScreen from '../../app/settings';
import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { createSettingsRepository } from '@/db/settings';
import { RepositoryProvider } from '@/hooks/useRepository';
import { SettingsRepositoryProvider } from '@/hooks/useSettings';
import { loadAppIconNative } from '@/platform/appIcon';
import { exportCsv } from '@/platform/exportCsv';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('@/hooks/useNow', () => ({ useToday: () => '2026-11-18' }));
jest.mock('@/platform/appIcon', () => ({ loadAppIconNative: jest.fn() }));
jest.mock('@/platform/exportCsv', () => ({ exportCsv: jest.fn() }));
jest.mock('@/platform/haptics', () => ({
  haptics: { selection: jest.fn(), tap: jest.fn(), success: jest.fn(), warning: jest.fn() },
}));

async function setup(entries: number) {
  const db = createTestExecutor();
  await runMigrations(db);
  const repo = createEntriesRepository(db);
  for (let i = 0; i < entries; i++) {
    await repo.add({ exerciseName: `E${i}`, sets: 3, reps: 5, weightKg: 20, date: '2026-11-17' });
  }
  const settings = createSettingsRepository(db);
  const Providers = ({ children }: { children: ReactNode }) => (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <RepositoryProvider repository={repo}>
        <SettingsRepositoryProvider settings={settings}>{children}</SettingsRepositoryProvider>
      </RepositoryProvider>
    </SafeAreaProvider>
  );
  await render(<SettingsScreen />, { wrapper: Providers });
  return { repo };
}

/** Answers each alert in turn by pressing the button with the given label (null = dismiss). */
function answer(...labels: (string | null)[]) {
  const queue = [...labels];
  const shown: string[] = [];
  jest.spyOn(Alert, 'alert').mockImplementation((title, _message, buttons?: AlertButton[]) => {
    shown.push(String(title));
    const label = queue.shift();
    buttons?.find((b) => b.text === label)?.onPress?.();
  });
  return shown;
}

const deleteRow = () => screen.getByRole('button', { name: 'Delete all data' });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(loadAppIconNative).mockResolvedValue(null);
  jest.mocked(exportCsv).mockResolvedValue(undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('Settings: Delete all data', () => {
  it('has a clearly labelled destructive row in the Data section', async () => {
    await setup(2);
    expect(deleteRow()).toBeOnTheScreen();
    expect(screen.getByText('Removes every logged exercise from this phone')).toBeOnTheScreen();
  });

  it('deletes everything only after both confirmations', async () => {
    const { repo } = await setup(3);
    const shown = answer('Continue', 'Delete everything', null);
    await fireEvent.press(deleteRow());
    await waitFor(async () => expect(await repo.getAll()).toEqual([]));
    expect(shown).toEqual(['Delete all your data?', 'Are you sure?', 'All data deleted']);
  });

  it('states how many exercises are about to go', async () => {
    await setup(3);
    const spy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await fireEvent.press(deleteRow());
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(String(spy.mock.calls[0]?.[1])).toContain('All 3 logged exercises');
  });

  it('keeps all data if the first prompt is cancelled', async () => {
    const { repo } = await setup(2);
    const shown = answer('Cancel');
    await fireEvent.press(deleteRow());
    await waitFor(() => expect(shown).toHaveLength(1));
    expect(await repo.getAll()).toHaveLength(2);
  });

  it('keeps all data if the final prompt is cancelled', async () => {
    const { repo } = await setup(2);
    const shown = answer('Continue', 'Cancel');
    await fireEvent.press(deleteRow());
    await waitFor(() => expect(shown).toHaveLength(2));
    expect(await repo.getAll()).toHaveLength(2);
  });

  it('keeps all data if a prompt is dismissed', async () => {
    const { repo } = await setup(2);
    const shown = answer(null);
    await fireEvent.press(deleteRow());
    await waitFor(() => expect(shown).toHaveLength(1));
    expect(await repo.getAll()).toHaveLength(2);
  });

  it('offers to export first, which shares the backup and deletes nothing', async () => {
    const { repo } = await setup(2);
    answer('Export first');
    await fireEvent.press(deleteRow());
    await waitFor(() => expect(exportCsv).toHaveBeenCalledTimes(1));
    expect(await repo.getAll()).toHaveLength(2);
  });

  it('says so instead of prompting when there is nothing to delete', async () => {
    await setup(0);
    const shown = answer(null);
    await fireEvent.press(deleteRow());
    await waitFor(() => expect(shown).toEqual(['Nothing to delete']));
  });

  it('reports a failure and leaves the data alone', async () => {
    const { repo } = await setup(2);
    jest.spyOn(repo, 'removeAll').mockRejectedValue(new Error('disk'));
    const shown = answer('Continue', 'Delete everything', null);
    await fireEvent.press(deleteRow());
    await waitFor(() => expect(shown).toContain("Couldn't delete"));
    expect(await repo.getAll()).toHaveLength(2);
  });
});
