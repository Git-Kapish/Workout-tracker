import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { openDatabase } from '@/db/client';
import type { EntriesRepository } from '@/db/entries';
import { DbError } from '@/db/errors';

const RepositoryContext = createContext<EntriesRepository | null>(null);

interface DatabaseProviderProps {
  children: ReactNode;
  /** Shown until the database is open and migrated. */
  loading: ReactNode;
  /** Blocking screen if opening or migrating fails; the app never runs on a half-migrated schema. */
  renderError: (error: DbError) => ReactNode;
}

export function DatabaseProvider({ children, loading, renderError }: DatabaseProviderProps) {
  const [repository, setRepository] = useState<EntriesRepository | null>(null);
  const [error, setError] = useState<DbError | null>(null);

  useEffect(() => {
    let cancelled = false;
    openDatabase().then(
      (repo) => {
        if (!cancelled) setRepository(repo);
      },
      (e: unknown) => {
        if (!cancelled)
          setError(e instanceof DbError ? e : new DbError('Could not open the database.', e));
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return renderError(error);
  if (!repository) return loading;
  return <RepositoryContext value={repository}>{children}</RepositoryContext>;
}

export function useRepository(): EntriesRepository {
  const repository = use(RepositoryContext);
  if (!repository) throw new Error('useRepository must be used inside <DatabaseProvider>.');
  return repository;
}
