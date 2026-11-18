import { useEffect, useState, type ReactNode } from 'react';

import { openDatabase, type Database } from '@/db/client';
import { DbError } from '@/db/errors';
import { WELCOME_SEEN_KEY } from '@/db/settings';

import { RepositoryProvider } from './useRepository';
import { WelcomeProvider } from './useWelcome';

interface DatabaseProviderProps {
  children: ReactNode;
  /** Shown until the database is open and migrated. */
  loading: ReactNode;
  /** Blocking screen if opening or migrating fails; the app never runs on a half-migrated schema. */
  renderError: (error: DbError) => ReactNode;
}

interface Ready {
  database: Database;
  welcomeSeen: boolean;
}

export function DatabaseProvider({ children, loading, renderError }: DatabaseProviderProps) {
  const [ready, setReady] = useState<Ready | null>(null);
  const [error, setError] = useState<DbError | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const database = await openDatabase();
      // Read the flag up front so the first screen shown is already the right one.
      const welcomeSeen = (await database.settings.get(WELCOME_SEEN_KEY)) === '1';
      if (!cancelled) setReady({ database, welcomeSeen });
    })().catch((e: unknown) => {
      if (!cancelled)
        setError(e instanceof DbError ? e : new DbError('Could not open the database.', e));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return renderError(error);
  if (!ready) return loading;
  return (
    <RepositoryProvider repository={ready.database.entries}>
      <WelcomeProvider settings={ready.database.settings} initialSeen={ready.welcomeSeen}>
        {children}
      </WelcomeProvider>
    </RepositoryProvider>
  );
}
