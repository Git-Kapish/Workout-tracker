import { requireOptionalNativeModule } from 'expo';

// Changing the Home Screen icon needs native code that is compiled into the app, so it only
// exists in a real build (TestFlight / development build), never in Expo Go. The package
// throws as soon as it is loaded without its native module, and Metro reports that throw as
// an error even when it is caught. So the native module is looked up first (that lookup does
// not throw), and the package is only loaded when it is really there.

export interface AppIconNative {
  setAlternateAppIcon(name: string | null): Promise<string | null>;
  getAppIconName(): string | null;
}

type AppIconModule = typeof import('expo-alternate-app-icons');

let loading: Promise<AppIconNative | null> | undefined;

/** The icon switcher, or null where it cannot work (Expo Go, unsupported device). */
export function loadAppIconNative(): Promise<AppIconNative | null> {
  loading ??= Promise.resolve().then(() => {
    if (!requireOptionalNativeModule('ExpoAlternateAppIcons')) return null;
    try {
      // A plain require keeps the load lazy; the package is optional at runtime.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module: AppIconModule = require('expo-alternate-app-icons');
      return module.supportsAlternateIcons ? module : null;
    } catch {
      return null;
    }
  });
  return loading;
}
