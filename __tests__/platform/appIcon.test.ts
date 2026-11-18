/** @jest-environment node */

// The adapter caches its (lazy) import, so each test loads a fresh copy of it.
function loadAdapter(mockPackage: () => unknown) {
  jest.resetModules();
  jest.doMock('expo-alternate-app-icons', mockPackage, { virtual: true });
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
    const { loadAppIconNative } = loadAdapter(() => working);
    const native = await loadAppIconNative();
    expect(native).not.toBeNull();
    expect(native?.getAppIconName()).toBeNull();
  });

  it('returns null in Expo Go, where importing the package throws (no native module)', async () => {
    const { loadAppIconNative } = loadAdapter(() => {
      throw new Error("Cannot find native module 'ExpoAlternateAppIcons'");
    });
    await expect(loadAppIconNative()).resolves.toBeNull();
  });

  it('returns null on a device that does not support alternate icons', async () => {
    const { loadAppIconNative } = loadAdapter(() => ({
      ...working,
      supportsAlternateIcons: false,
    }));
    await expect(loadAppIconNative()).resolves.toBeNull();
  });

  it('only imports the package once', async () => {
    let imports = 0;
    const { loadAppIconNative } = loadAdapter(() => {
      imports += 1;
      return working;
    });
    await Promise.all([loadAppIconNative(), loadAppIconNative()]);
    await loadAppIconNative();
    expect(imports).toBe(1);
  });
});
