import * as SQLite from 'expo-sqlite';

import { createEntriesRepository, type EntriesRepository } from './entries';
import { guard } from './errors';
import { runMigrations } from './migrations';
import { createSettingsRepository, type SettingsRepository } from './settings';
import type { SqlExecutor } from './sql';

export const DATABASE_NAME = 'tally.db';

export interface Database {
  entries: EntriesRepository;
  settings: SettingsRepository;
}

function createExpoExecutor(db: SQLite.SQLiteDatabase): SqlExecutor {
  return {
    exec: (sql) => db.execAsync(sql),
    run: async (sql, params = []) => {
      const { lastInsertRowId, changes } = await db.runAsync(
        sql,
        params as SQLite.SQLiteBindValue[],
      );
      return { lastInsertRowId, changes };
    },
    all: (sql, params = []) => db.getAllAsync(sql, params as SQLite.SQLiteBindValue[]),
    first: (sql, params = []) => db.getFirstAsync(sql, params as SQLite.SQLiteBindValue[]),
    transaction: async (fn) => {
      let outcome: { value: Awaited<ReturnType<typeof fn>> } | undefined;
      await db.withTransactionAsync(async () => {
        outcome = { value: await fn() };
      });
      if (!outcome) throw new Error('Transaction finished without a result.');
      return outcome.value;
    },
  };
}

/** Opens the on-device database, migrates it to the latest schema, and returns its repositories. */
export function openDatabase(name: string = DATABASE_NAME): Promise<Database> {
  return guard('open', async () => {
    const db = await SQLite.openDatabaseAsync(name);
    await db.execAsync('PRAGMA journal_mode = WAL');
    const executor = createExpoExecutor(db);
    await runMigrations(executor);
    return {
      entries: createEntriesRepository(executor),
      settings: createSettingsRepository(executor),
    };
  });
}
