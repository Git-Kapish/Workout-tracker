import { createContext, use, useCallback, useState, type ReactNode } from 'react';

import { WELCOME_SEEN_KEY, type SettingsRepository } from '@/db/settings';

interface WelcomeState {
  /** Known before the app renders, so there is never a flash of the wrong screen. */
  seen: boolean;
  markSeen: () => Promise<void>;
}

const WelcomeContext = createContext<WelcomeState | null>(null);

export function WelcomeProvider({
  settings,
  initialSeen,
  children,
}: {
  settings: SettingsRepository;
  initialSeen: boolean;
  children: ReactNode;
}) {
  const [seen, setSeen] = useState(initialSeen);

  const markSeen = useCallback(async () => {
    // Persist first: if the write fails the welcome screen simply shows again next launch.
    await settings.set(WELCOME_SEEN_KEY, '1');
    setSeen(true);
  }, [settings]);

  return <WelcomeContext value={{ seen, markSeen }}>{children}</WelcomeContext>;
}

export function useWelcome(): WelcomeState {
  const state = use(WelcomeContext);
  if (!state) throw new Error('useWelcome must be used inside <DatabaseProvider>.');
  return state;
}
