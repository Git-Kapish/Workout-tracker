import { createContext, use, type ReactNode } from 'react';

import type { SettingsRepository } from '@/db/settings';

const SettingsContext = createContext<SettingsRepository | null>(null);

export function SettingsRepositoryProvider({
  settings,
  children,
}: {
  settings: SettingsRepository;
  children: ReactNode;
}) {
  return <SettingsContext value={settings}>{children}</SettingsContext>;
}

export function useSettingsRepository(): SettingsRepository {
  const settings = use(SettingsContext);
  if (!settings) throw new Error('useSettingsRepository must be used inside <DatabaseProvider>.');
  return settings;
}
