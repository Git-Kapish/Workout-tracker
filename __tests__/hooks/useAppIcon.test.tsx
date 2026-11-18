import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { runMigrations } from '@/db/migrations';
import { createSettingsRepository } from '@/db/settings';
import { useAppIcon } from '@/hooks/useAppIcon';
import { SettingsRepositoryProvider } from '@/hooks/useSettings';
import { APP_ICON_SETTING_KEY } from '@/lib/appIcons';
import { loadAppIconNative } from '@/platform/appIcon';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('@/platform/appIcon', () => ({ loadAppIconNative: jest.fn() }));

function fakeNative(active: string | null = null) {
  const native = {
    getAppIconName: jest.fn(() => active),
    setAlternateAppIcon: jest.fn(async (name: string | null) => name),
  };
  jest.mocked(loadAppIconNative).mockResolvedValue(native);
  return native;
}

async function setup(saved?: string) {
  const db = createTestExecutor();
  await runMigrations(db);
  const settings = createSettingsRepository(db);
  if (saved) await settings.set(APP_ICON_SETTING_KEY, saved);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SettingsRepositoryProvider settings={settings}>{children}</SettingsRepositoryProvider>
  );
  const hook = await renderHook(() => useAppIcon(), { wrapper });
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  return { settings, ...hook };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('useAppIcon in Expo Go (no native icon switching)', () => {
  beforeEach(() => jest.mocked(loadAppIconNative).mockResolvedValue(null));

  it('starts on the default icon and says the icon cannot be changed here', async () => {
    const { result } = await setup();
    expect(result.current.selected).toBe('default');
    expect(result.current.canChange).toBe(false);
  });

  it('shows the saved choice as selected', async () => {
    const { result } = await setup('brand');
    expect(result.current.selected).toBe('brand');
  });

  it('falls back to the default for a corrupt saved value', async () => {
    const { result } = await setup('not-an-icon');
    expect(result.current.selected).toBe('default');
  });

  it('remembers a new choice without trying to change the real icon', async () => {
    const { result, settings } = await setup();
    await act(async () => result.current.choose('light'));
    expect(result.current.selected).toBe('light');
    expect(await settings.get(APP_ICON_SETTING_KEY)).toBe('light');
    expect(result.current.error).toBeNull();
  });
});

describe('useAppIcon in a real build', () => {
  it('reads the active icon from the phone, not from the saved setting', async () => {
    fakeNative('IconBrand');
    const { result } = await setup('light'); // a stale saved value loses to what iOS reports
    expect(result.current.selected).toBe('brand');
    expect(result.current.canChange).toBe(true);
  });

  it('treats a missing active icon as the default', async () => {
    fakeNative(null);
    const { result } = await setup();
    expect(result.current.selected).toBe('default');
  });

  it('changes the real icon (alternate by its registered name) and remembers it', async () => {
    const native = fakeNative(null);
    const { result, settings } = await setup();
    await act(async () => result.current.choose('light'));
    expect(native.setAlternateAppIcon).toHaveBeenCalledWith('IconLight');
    expect(result.current.selected).toBe('light');
    expect(await settings.get(APP_ICON_SETTING_KEY)).toBe('light');
  });

  it('switches back to the default by passing null', async () => {
    const native = fakeNative('IconBrand');
    const { result } = await setup();
    await act(async () => result.current.choose('default'));
    expect(native.setAlternateAppIcon).toHaveBeenCalledWith(null);
    expect(result.current.selected).toBe('default');
  });

  it('does nothing when the chosen icon is already active', async () => {
    const native = fakeNative('IconLight');
    const { result } = await setup();
    await act(async () => result.current.choose('light'));
    expect(native.setAlternateAppIcon).not.toHaveBeenCalled();
  });

  it('keeps the old choice and shows a friendly error if iOS refuses', async () => {
    const native = fakeNative(null);
    native.setAlternateAppIcon.mockRejectedValue(new Error('refused'));
    const { result, settings } = await setup();
    await act(async () => result.current.choose('brand'));
    expect(result.current.selected).toBe('default');
    expect(await settings.get(APP_ICON_SETTING_KEY)).toBeNull(); // never claims it worked
    expect(result.current.error).toBe("Couldn't change the icon. Please try again.");
    expect(result.current.busy).toBe(false);
  });

  it('clears the error on the next successful change', async () => {
    const native = fakeNative(null);
    native.setAlternateAppIcon.mockRejectedValueOnce(new Error('refused'));
    const { result } = await setup();
    await act(async () => result.current.choose('brand'));
    expect(result.current.error).not.toBeNull();
    await act(async () => result.current.choose('brand'));
    expect(result.current.error).toBeNull();
    expect(result.current.selected).toBe('brand');
  });

  it('ignores a second request while one is in flight', async () => {
    const native = fakeNative(null);
    let release: () => void = () => undefined;
    native.setAlternateAppIcon.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve(null);
        }),
    );
    const { result } = await setup();
    await act(async () => {
      void result.current.choose('light');
      void result.current.choose('brand'); // double tap on another icon
    });
    expect(native.setAlternateAppIcon).toHaveBeenCalledTimes(1);
    expect(native.setAlternateAppIcon).toHaveBeenCalledWith('IconLight');
    await act(async () => release());
    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.selected).toBe('light');
  });
});

describe('useAppIcon when loading fails', () => {
  it('still becomes ready, on the default icon', async () => {
    jest.mocked(loadAppIconNative).mockRejectedValue(new Error('boom'));
    const { result } = await setup();
    expect(result.current.selected).toBe('default');
    expect(result.current.canChange).toBe(false);
  });
});
