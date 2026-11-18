// Changing the Home Screen icon needs native code that is compiled into the app, so it only
// exists in a real build (TestFlight / development build), never in Expo Go. The package
// throws when it is loaded without its native module, so it is required lazily inside a
// try block, and a failure simply means "not available here".

export interface AppIconNative {
  setAlternateAppIcon(name: string | null): Promise<string | null>;
  getAppIconName(): string | null;
}

type AppIconModule = typeof import('expo-alternate-app-icons');

let loading: Promise<AppIconNative | null> | undefined;

/** The icon switcher, or null where it cannot work (Expo Go, unsupported device). */
export function loadAppIconNative(): Promise<AppIconNative | null> {
  loading ??= Promise.resolve().then(() => {
    try {
      // A plain require keeps the load lazy and catchable; the package is optional at runtime.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module: AppIconModule = require('expo-alternate-app-icons');
      return module.supportsAlternateIcons ? module : null;
    } catch {
      return null;
    }
  });
  return loading;
}
