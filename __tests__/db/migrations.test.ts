/** @jest-environment node */
import { DbError } from '@/db/errors';
import { MIGRATIONS, runMigrations, type Migration } from '@/db/migrations';
import { createTestExecutor } from '../helpers/sqliteExecutor';

const version = async (db: ReturnType<typeof createTestExecutor>) =>
  (await db.first<{ user_version: number }>('PRAGMA user_version'))?.user_version;

const tableExists = async (db: ReturnType<typeof createTestExecutor>, name: string) =>
  (await db.first("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", [name])) !==
  null;

describe('runMigrations', () => {
  it('takes a fresh database to the latest version', async () => {
    const db = createTestExecutor();
    expect(await version(db)).toBe(0);
    expect(await runMigrations(db)).toBe(MIGRATIONS.length);
    expect(await version(db)).toBe(MIGRATIONS.length);
    expect(await tableExists(db, 'entries')).toBe(true);
    db.close();
  });

  it('is a no-op when run again (does not re-run migrations or touch data)', async () => {
    const db = createTestExecutor();
    await runMigrations(db);
    await db.run(
      `INSERT INTO entries (exercise_name, sets, reps, weight_kg, date, created_at) VALUES ('Squat', 4, 8, 60, '2026-11-17', 'x')`,
    );
    await runMigrations(db); // would throw "table entries already exists" if v1 re-ran
    expect(await version(db)).toBe(MIGRATIONS.length);
    expect((await db.all('SELECT * FROM entries')).length).toBe(1);
    db.close();
  });

  it('keeps existing entries when a new migration is applied on top', async () => {
    const db = createTestExecutor();
    await runMigrations(db);
    await db.run(
      `INSERT INTO entries (exercise_name, sets, reps, weight_kg, date, created_at) VALUES ('Squat', 4, 8, 60, '2026-11-17', 'x')`,
    );
    const v2: Migration[] = [
      ...MIGRATIONS,
      { version: 2, up: `ALTER TABLE entries ADD COLUMN note TEXT;` },
    ];
    expect(await runMigrations(db, v2)).toBe(2);
    expect(await version(db)).toBe(2);
    expect(await db.all('SELECT exercise_name, sets, note FROM entries')).toEqual([
      { exercise_name: 'Squat', sets: 4, note: null },
    ]);
    db.close();
  });

  it('rolls a failed migration back completely and leaves the version unchanged', async () => {
    const db = createTestExecutor();
    await runMigrations(db);
    const broken: Migration[] = [
      ...MIGRATIONS,
      { version: 2, up: `CREATE TABLE half_done (id INTEGER); THIS IS NOT SQL;` },
    ];
    await expect(runMigrations(db, broken)).rejects.toBeInstanceOf(DbError);
    expect(await version(db)).toBe(1);
    expect(await tableExists(db, 'half_done')).toBe(false);
    expect(await tableExists(db, 'entries')).toBe(true);
    db.close();
  });

  it('refuses a database that is newer than the app', async () => {
    const db = createTestExecutor();
    await runMigrations(db);
    await db.exec('PRAGMA user_version = 99');
    await expect(runMigrations(db)).rejects.toBeInstanceOf(DbError);
    db.close();
  });

  it('rejects a migration list with gaps or wrong order', async () => {
    const db = createTestExecutor();
    await expect(runMigrations(db, [{ version: 2, up: 'SELECT 1' }])).rejects.toBeInstanceOf(
      DbError,
    );
    expect(await version(db)).toBe(0);
    db.close();
  });
});

describe('schema constraints (second line of defence)', () => {
  const insert = (
    db: ReturnType<typeof createTestExecutor>,
    sets: number,
    reps: number,
    kg: number | null,
  ) =>
    db.run(
      `INSERT INTO entries (exercise_name, sets, reps, weight_kg, date, created_at) VALUES ('X', ?, ?, ?, '2026-11-17', 'x')`,
      [sets, reps, kg],
    );

  it('rejects zero sets/reps and negative weight, allows null and zero weight', async () => {
    const db = createTestExecutor();
    await runMigrations(db);
    await expect(insert(db, 0, 5, 10)).rejects.toThrow();
    await expect(insert(db, 3, 0, 10)).rejects.toThrow();
    await expect(insert(db, 3, 5, -1)).rejects.toThrow();
    await expect(insert(db, 3, 5, null)).resolves.toBeDefined();
    await expect(insert(db, 3, 5, 0)).resolves.toBeDefined();
    db.close();
  });
});
