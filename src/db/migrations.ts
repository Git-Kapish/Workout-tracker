import { DbError, guard } from './errors';
import type { SqlExecutor } from './sql';

export interface Migration {
  /** Contiguous from 1. Never edit a shipped migration; append a new one. */
  version: number;
  up: string;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    up: `
      CREATE TABLE entries (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise_name TEXT    NOT NULL,
        sets          INTEGER NOT NULL CHECK (sets > 0),
        reps          INTEGER NOT NULL CHECK (reps > 0),
        weight_kg     REAL    CHECK (weight_kg IS NULL OR weight_kg >= 0),
        date          TEXT    NOT NULL,
        created_at    TEXT    NOT NULL
      );
      CREATE INDEX idx_entries_date ON entries(date);
      CREATE INDEX idx_entries_name ON entries(exercise_name COLLATE NOCASE);
    `,
  },
];

function assertOrdered(migrations: readonly Migration[]): void {
  migrations.forEach((m, i) => {
    if (m.version !== i + 1) {
      throw new DbError(
        `Migrations must be numbered 1..n without gaps (found ${m.version} at position ${i + 1}).`,
      );
    }
  });
}

/**
 * Brings the database to the latest version. Each migration and its version bump share one
 * transaction, so a failure leaves the previous schema intact. Returns the resulting version.
 */
export async function runMigrations(
  db: SqlExecutor,
  migrations: readonly Migration[] = MIGRATIONS,
): Promise<number> {
  assertOrdered(migrations);
  return guard('migration', async () => {
    const row = await db.first<{ user_version: number }>('PRAGMA user_version');
    const current = row?.user_version ?? 0;
    const latest = migrations.length;
    if (current > latest) {
      throw new DbError(
        `Database is version ${current} but this app only knows version ${latest}. Update the app.`,
      );
    }
    for (const migration of migrations.slice(current)) {
      await db.transaction(async () => {
        await db.exec(migration.up);
        // user_version cannot be a bound parameter; the value is our own integer.
        await db.exec(`PRAGMA user_version = ${migration.version}`);
      });
    }
    return latest;
  });
}
