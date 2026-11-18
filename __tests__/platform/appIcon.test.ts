/** @jest-environment node */

// The adapter caches its (lazy) load, so each test gets a fresh copy of it.
function loadAdapter(options: { nativeModule: boolean; pkg: () => unknown }) {
  jest.resetModules();
  jest.doMock('expo', () => ({
    requireOptionalNativeModule: () => (options.nativeModule ? {} : null),
  }));
  jest.doMock('expo-alternate-app-icons', options.pkg, { virtual: true });
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/platform/appIcon') as typeof import('@/platform/appIcon');
}

describe('loadAppIconNative', () => {
  const working = {
    supportsAlternateIcons: true,
    setAlternateAppIcon: jest.fn(),
    getAppIconName: jest.fn(() => null),
  };

  it('returns the switcher in a real build where alternate icons are supported', async () => {
    const { loadAppIconNative } = loadAdapter({ nativeModule: true, pkg: () => working });
    const native = await loadAppIconNative();
    expect(native).not.toBeNull();
    expect(native?.getAppIconName()).toBeNull();
  });

  it('in Expo Go (no native module) returns null WITHOUT ever loading the package, which would throw and be logged as an error', async () => {
    let loaded = 0;
    const { loadAppIconNative } = loadAdapter({
      nativeModule: false,
      pkg: () => {
        loaded += 1;
        throw new Error("Cannot find native module 'ExpoAlternateAppIcons'");
      },
    });
    await expect(loadAppIconNative()).resolves.toBeNull();
    expect(loaded).toBe(0);
  });

  it('returns null if the package still fails to load', async () => {
    const { loadAppIconNative } = loadAdapter({
      nativeModule: true,
      pkg: () => {
        throw new Error('broken');
      },
    });
    await expect(loadAppIconNative()).resolves.toBeNull();
  });

  it('returns null on a device that does not support alternate icons', async () => {
    const { loadAppIconNative } = loadAdapter({
      nativeModule: true,
      pkg: () => ({ ...working, supportsAlternateIcons: false }),
    });
    await expect(loadAppIconNative()).resolves.toBeNull();
  });

  it('only loads the package once', async () => {
    let loads = 0;
    const { loadAppIconNative } = loadAdapter({
      nativeModule: true,
      pkg: () => {
        loads += 1;
        return working;
      },
    });
    await Promise.all([loadAppIconNative(), loadAppIconNative()]);
    await loadAppIconNative();
    expect(loads).toBe(1);
  });
});
