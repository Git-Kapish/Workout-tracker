import Database from 'better-sqlite3';

import type { SqlExecutor } from '@/db/sql';

/** Real SQLite (in memory) behind the same SqlExecutor seam the app uses with expo-sqlite. */
export function createTestExecutor(): SqlExecutor & { close(): void } {
  const db = new Database(':memory:');
  return {
    exec: async (sql) => {
      db.exec(sql);
    },
    run: async (sql, params = []) => {
      const info = db.prepare(sql).run(...params);
      return { lastInsertRowId: Number(info.lastInsertRowid), changes: info.changes };
    },
    all: async <T>(sql: string, params: unknown[] = []) => db.prepare(sql).all(...params) as T[],
    first: async <T>(sql: string, params: unknown[] = []) =>
      (db.prepare(sql).get(...params) as T | undefined) ?? null,
    transaction: async (fn) => {
      db.exec('BEGIN');
      try {
        const value = await fn();
        db.exec('COMMIT');
        return value;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    close: () => {
      db.close();
    },
  };
}
