import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';

import { ExportButton } from '@/components/ExportButton';
import { createEntriesRepository, type EntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { RepositoryProvider } from '@/hooks/useRepository';
import { exportCsv } from '@/platform/exportCsv';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({ useFocusEffect: () => undefined }));
jest.mock('@/hooks/useNow', () => ({ useToday: () => '2026-11-17' }));
jest.mock('@/platform/exportCsv', () => ({ exportCsv: jest.fn() }));

async function setup(
  entryCount: number,
  wrap: (r: EntriesRepository) => EntriesRepository = (r) => r,
) {
  const db = createTestExecutor();
  await runMigrations(db);
  const repo = createEntriesRepository(db);
  for (let i = 0; i < entryCount; i++) {
    await repo.add({
      exerciseName: `E${i}`,
      sets: 3,
      reps: 5,
      weightKg: 20,
      date: '2026-11-1' + (i % 9),
    });
  }
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <RepositoryProvider repository={wrap(repo)}>{children}</RepositoryProvider>
  );
  await render(<ExportButton />, { wrapper: Wrapper });
}

const button = () => screen.getByRole('button', { name: 'Export data as CSV' });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(exportCsv).mockResolvedValue(undefined);
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('ExportButton', () => {
  it('exports every entry, in order, with today as the file date, and shows no alert on success', async () => {
    await setup(3);
    await fireEvent.press(button());
    await waitFor(() => expect(exportCsv).toHaveBeenCalledTimes(1));
    const [entries, today] = jest.mocked(exportCsv).mock.calls[0] ?? [];
    expect(entries).toHaveLength(3);
    expect(today).toBe('2026-11-17');
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('says there is nothing to export instead of sharing an empty file', async () => {
    await setup(0);
    await fireEvent.press(button());
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Nothing to export yet', expect.any(String)),
    );
    expect(exportCsv).not.toHaveBeenCalled();
  });

  it('shows a friendly message when export fails, and the data stays put', async () => {
    jest.mocked(exportCsv).mockRejectedValue(new Error('disk full'));
    await setup(2);
    await fireEvent.press(button());
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith("Couldn't export", expect.stringContaining('safe')),
    );
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it('shows a friendly message when reading the data fails', async () => {
    await setup(2, (repo) => ({
      ...repo,
      getAll: async () => {
        throw new Error('db down');
      },
    }));
    await fireEvent.press(button());
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith("Couldn't export", expect.any(String)),
    );
    expect(exportCsv).not.toHaveBeenCalled();
  });

  it('ignores a second tap while an export is running, then works again', async () => {
    let release: () => void = () => undefined;
    jest.mocked(exportCsv).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    await setup(2);
    await act(async () => {
      fireEvent.press(button());
      fireEvent.press(button()); // second tap before the first finished
    });
    await waitFor(() => expect(exportCsv).toHaveBeenCalledTimes(1));
    expect(button()).toBeDisabled();

    await act(async () => release());
    await waitFor(() => expect(button()).toBeEnabled());
    await fireEvent.press(button());
    await waitFor(() => expect(exportCsv).toHaveBeenCalledTimes(2));
  });
});
