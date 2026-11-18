import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { openDatabase, type Database } from '@/db/client';
import { DbError } from '@/db/errors';
import { WELCOME_SEEN_KEY } from '@/db/settings';

import { RepositoryProvider } from './useRepository';
import { SettingsRepositoryProvider } from './useSettings';
import { WelcomeProvider } from './useWelcome';

interface DatabaseProviderProps {
  children: ReactNode;
  /** Shown until the database is open and migrated. */
  loading: ReactNode;
  /**
   * Blocking screen if opening or migrating fails; the app never runs on a half-migrated
   * schema. `retry` tries to open the database again.
   */
  renderError: (error: DbError, retry: () => void) => ReactNode;
}

interface Ready {
  database: Database;
  welcomeSeen: boolean;
}

export function DatabaseProvider({ children, loading, renderError }: DatabaseProviderProps) {
  const [ready, setReady] = useState<Ready | null>(null);
  const [error, setError] = useState<DbError | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const database = await openDatabase();
      // Read the flag up front so the first screen shown is already the right one.
      const welcomeSeen = (await database.settings.get(WELCOME_SEEN_KEY)) === '1';
      if (!cancelled) setReady({ database, welcomeSeen });
    })().catch((e: unknown) => {
      console.error('Could not open the database', e);
      if (!cancelled)
        setError(e instanceof DbError ? e : new DbError('Could not open the database.', e));
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) return renderError(error, retry);
  if (!ready) return loading;
  return (
    <RepositoryProvider repository={ready.database.entries}>
      <SettingsRepositoryProvider settings={ready.database.settings}>
        <WelcomeProvider settings={ready.database.settings} initialSeen={ready.welcomeSeen}>
          {children}
        </WelcomeProvider>
      </SettingsRepositoryProvider>
    </RepositoryProvider>
  );
}
