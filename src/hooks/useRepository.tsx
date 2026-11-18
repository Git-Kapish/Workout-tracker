import { createContext, use, type ReactNode } from 'react';

import type { EntriesRepository } from '@/db/entries';

// Kept free of expo-sqlite on purpose: tests and components can use a repository without
// pulling in the native module. The app opens the real database in DatabaseProvider.
const RepositoryContext = createContext<EntriesRepository | null>(null);

/** Supplies an already-open repository (the app uses DatabaseProvider; tests use this). */
export function RepositoryProvider({
  repository,
  children,
}: {
  repository: EntriesRepository;
  children: ReactNode;
}) {
  return <RepositoryContext value={repository}>{children}</RepositoryContext>;
}

export function useRepository(): EntriesRepository {
  const repository = use(RepositoryContext);
  if (!repository) throw new Error('useRepository must be used inside <DatabaseProvider>.');
  return repository;
}
