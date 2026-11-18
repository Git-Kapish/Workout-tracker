import { guard } from './errors';
import type { SqlExecutor } from './sql';

export const WELCOME_SEEN_KEY = 'welcome_seen';

export interface SettingsRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export function createSettingsRepository(db: SqlExecutor): SettingsRepository {
  return {
    get: (key) =>
      guard('settings.get', async () => {
        const row = await db.first<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
          key,
        ]);
        return row?.value ?? null;
      }),
    set: (key, value) =>
      guard('settings.set', async () => {
        await db.run(
          'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
          [key, value],
        );
      }),
  };
}
