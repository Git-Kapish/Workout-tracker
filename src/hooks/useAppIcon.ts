import { useCallback, useEffect, useRef, useState } from 'react';

import {
  APP_ICON_SETTING_KEY,
  appIconFromNativeName,
  nativeNameForIcon,
  parseAppIconId,
  type AppIconId,
} from '@/lib/appIcons';
import { loadAppIconNative, type AppIconNative } from '@/platform/appIcon';

import { useSettingsRepository } from './useSettings';

/**
 * The chosen Home Screen icon. In a real build the phone is the source of truth (and choosing
 * actually changes the icon). In Expo Go the icon cannot change, so the choice is only
 * remembered and `canChange` is false for the UI to say so.
 */
export function useAppIcon() {
  const settings = useSettingsRepository();
  const [selected, setSelected] = useState<AppIconId>('default');
  const [ready, setReady] = useState(false);
  const [canChange, setCanChange] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const native = useRef<AppIconNative | null>(null);
  const running = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      native.current = await loadAppIconNative();
      const icon = native.current
        ? appIconFromNativeName(native.current.getAppIconName())
        : parseAppIconId(await settings.get(APP_ICON_SETTING_KEY));
      if (!active) return;
      setCanChange(native.current !== null);
      setSelected(icon);
      setReady(true);
    })().catch(() => {
      if (active) setReady(true); // fall back to the default and a read-only picker
    });
    return () => {
      active = false;
    };
  }, [settings]);

  const choose = useCallback(
    async (id: AppIconId) => {
      if (running.current || id === selected) return;
      running.current = true;
      setBusy(true);
      setError(null);
      try {
        // Native first: if iOS refuses, the saved choice must not claim it worked.
        await native.current?.setAlternateAppIcon(nativeNameForIcon(id));
        await settings.set(APP_ICON_SETTING_KEY, id);
        setSelected(id);
      } catch (e) {
        console.error('Could not change the app icon', e);
        setError("Couldn't change the icon. Please try again.");
      } finally {
        running.current = false;
        setBusy(false);
      }
    },
    [selected, settings],
  );

  return { selected, ready, canChange, busy, error, choose };
}
