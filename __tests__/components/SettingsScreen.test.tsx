import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SettingsScreen from '../../app/settings';
import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { createSettingsRepository } from '@/db/settings';
import { RepositoryProvider } from '@/hooks/useRepository';
import { SettingsRepositoryProvider } from '@/hooks/useSettings';
import { APP_ICON_SETTING_KEY } from '@/lib/appIcons';
import { loadAppIconNative } from '@/platform/appIcon';
import { exportCsv } from '@/platform/exportCsv';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('@/hooks/useNow', () => ({ useToday: () => '2026-11-18' }));
jest.mock('@/platform/appIcon', () => ({ loadAppIconNative: jest.fn() }));
jest.mock('@/platform/exportCsv', () => ({ exportCsv: jest.fn() }));

async function setup({ entries = 0 }: { entries?: number } = {}) {
  const db = createTestExecutor();
  await runMigrations(db);
  const repo = createEntriesRepository(db);
  const settings = createSettingsRepository(db);
  for (let i = 0; i < entries; i++) {
    await repo.add({ exerciseName: `E${i}`, sets: 3, reps: 5, weightKg: 20, date: '2026-11-17' });
  }
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
  return { settings };
}

const icon = (label: string) =>
  screen.getByRole('radio', { name: new RegExp(`^${label} app icon`) });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(loadAppIconNative).mockResolvedValue(null); // Expo Go unless a test says otherwise
  jest.mocked(exportCsv).mockResolvedValue(undefined);
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('Settings screen', () => {
  it('shows the logo, the version and the three sections', async () => {
    await setup();
    expect(screen.getByText('settings.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Tally logo')).toBeOnTheScreen();
    expect(screen.getByText(/^Tally \d+\.\d+\.\d+$/)).toBeOnTheScreen();
    expect(screen.getByText('APP ICON')).toBeOnTheScreen();
    expect(screen.getByText('DATA')).toBeOnTheScreen();
    expect(screen.getByText('ABOUT')).toBeOnTheScreen();
    expect(screen.getByText(/never uses the network/)).toBeOnTheScreen();
  });

  it('closes with the close button', async () => {
    await setup();
    await fireEvent.press(screen.getByRole('button', { name: 'Close settings' }));
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});

describe('Settings: app icon (Expo Go)', () => {
  it('offers the three logo-pack icons with the dark default selected', async () => {
    await setup();
    await waitFor(() => expect(icon('Dark')).toBeEnabled());
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(icon('Dark')).toBeChecked();
    expect(icon('Light')).not.toBeChecked();
    expect(icon('Brand')).not.toBeChecked();
    expect(screen.getByLabelText('Dark app icon, The default')).toBeOnTheScreen();
  });

  it('says honestly that the Home Screen icon cannot change here', async () => {
    await setup();
    expect(await screen.findByText(/only works in the installed app/)).toBeOnTheScreen();
  });

  it('saves the choice and shows it selected', async () => {
    const { settings } = await setup();
    await waitFor(() => expect(icon('Light')).toBeEnabled());
    await fireEvent.press(icon('Light'));
    await waitFor(() => expect(icon('Light')).toBeChecked());
    expect(icon('Dark')).not.toBeChecked();
    expect(await settings.get(APP_ICON_SETTING_KEY)).toBe('light');
  });

  it('restores the saved choice the next time Settings opens', async () => {
    const db = createTestExecutor();
    await runMigrations(db);
    await createSettingsRepository(db).set(APP_ICON_SETTING_KEY, 'brand');
    await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        <RepositoryProvider repository={createEntriesRepository(db)}>
          <SettingsRepositoryProvider settings={createSettingsRepository(db)}>
            <SettingsScreen />
          </SettingsRepositoryProvider>
        </RepositoryProvider>
      </SafeAreaProvider>,
    );
    await waitFor(() => expect(icon('Brand')).toBeChecked());
  });
});

describe('Settings: app icon (installed app)', () => {
  it('changes the real icon and explains what iOS will do', async () => {
    const native = {
      getAppIconName: jest.fn(() => null),
      setAlternateAppIcon: jest.fn(async (name: string | null) => name),
    };
    jest.mocked(loadAppIconNative).mockResolvedValue(native);
    await setup();
    expect(await screen.findByText(/Changes the icon on your Home Screen/)).toBeOnTheScreen();

    await fireEvent.press(icon('Brand'));
    await waitFor(() => expect(native.setAlternateAppIcon).toHaveBeenCalledWith('IconBrand'));
    await waitFor(() => expect(icon('Brand')).toBeChecked());
  });

  it('shows an error and keeps the old icon selected if iOS refuses', async () => {
    const native = {
      getAppIconName: jest.fn(() => null),
      setAlternateAppIcon: jest.fn().mockRejectedValue(new Error('refused')),
    };
    jest.mocked(loadAppIconNative).mockResolvedValue(native);
    await setup();
    await waitFor(() => expect(icon('Light')).toBeEnabled());
    await fireEvent.press(icon('Light'));
    expect(
      await screen.findByText("Couldn't change the icon. Please try again."),
    ).toBeOnTheScreen();
    expect(icon('Dark')).toBeChecked();
  });
});

describe('Settings: data', () => {
  it('exports everything from the Export row', async () => {
    await setup({ entries: 3 });
    await fireEvent.press(screen.getByRole('button', { name: 'Export all data as CSV' }));
    await waitFor(() => expect(exportCsv).toHaveBeenCalledTimes(1));
    expect(jest.mocked(exportCsv).mock.calls[0]?.[0]).toHaveLength(3);
    expect(jest.mocked(exportCsv).mock.calls[0]?.[1]).toBe('2026-11-18');
  });

  it('says there is nothing to export instead of sharing an empty file', async () => {
    await setup({ entries: 0 });
    await fireEvent.press(screen.getByRole('button', { name: 'Export all data as CSV' }));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Nothing to export yet', expect.any(String)),
    );
    expect(exportCsv).not.toHaveBeenCalled();
  });

  it('tells the user when the export fails, and that the data is safe', async () => {
    jest.mocked(exportCsv).mockRejectedValue(new Error('disk full'));
    await setup({ entries: 2 });
    await fireEvent.press(screen.getByRole('button', { name: 'Export all data as CSV' }));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith("Couldn't export", expect.stringContaining('safe')),
    );
  });
});
