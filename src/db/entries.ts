import { isValidDateString } from '@/lib/dates';
import type { DateString, Entry, NewEntry } from '@/lib/types';

import { DbError, guard } from './errors';
import type { SqlExecutor } from './sql';

// Method names follow ARCHITECTURE.md §3.2 (plan.md's getEntriesByDateRange etc. map to these).
export interface EntriesRepository {
  add(entry: NewEntry): Promise<Entry>;
  update(id: number, entry: NewEntry): Promise<Entry>;
  remove(id: number): Promise<void>;
  getById(id: number): Promise<Entry | null>;
  /** Inclusive on both ends; ordered by date then id. */
  getByDateRange(start: DateString, end: DateString): Promise<Entry[]>;
  /** Case-insensitive (ASCII); newest first. */
  getByExercise(name: string): Promise<Entry[]>;
  /** Ordered by date then id (CSV export order). */
  getAll(): Promise<Entry[]>;
  /** One spelling per exercise (the most recently used), most recently used first. */
  distinctExerciseNames(): Promise<string[]>;
  lastForExercise(name: string): Promise<Entry | null>;
  /** Called after every successful write. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
}

const COLUMNS = 'id, exercise_name, sets, reps, weight_kg, date';

// shortcut: NOCASE folds ASCII letters only ("É" != "é"), upgrade by storing a normalised key if needed.
const BY_NAME = 'exercise_name = ? COLLATE NOCASE';

function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}

/** Validates a raw row once, here, so NaN or junk can never reach the UI. */
function toEntry(row: unknown): Entry {
  const r = (row ?? {}) as Record<string, unknown>;
  const { id, exercise_name: name, sets, reps, weight_kg: weight, date } = r;
  const ok =
    typeof id === 'number' &&
    Number.isInteger(id) &&
    typeof name === 'string' &&
    name.length > 0 &&
    isPositiveInt(sets) &&
    isPositiveInt(reps) &&
    (weight === null || (typeof weight === 'number' && Number.isFinite(weight) && weight >= 0)) &&
    typeof date === 'string' &&
    isValidDateString(date);
  if (!ok) throw new DbError('Found a corrupt entry in the database.', row);
  return {
    id,
    exerciseName: name,
    sets,
    reps,
    weightKg: weight as number | null,
    date,
  };
}

export function createEntriesRepository(
  db: SqlExecutor,
  // The repository is shell code, so it may read the clock for the audit timestamp.
  now: () => Date = () => new Date(),
): EntriesRepository {
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch (error) {
        // One broken subscriber must not break the write or the other subscribers.
        console.error('Entries listener failed', error);
      }
    }
  };

  const query = (operation: string, sql: string, params: unknown[] = []) =>
    guard(operation, async () => (await db.all<unknown>(sql, params)).map(toEntry));

  return {
    add: (entry) =>
      guard('add', async () => {
        const result = await db.run(
          `INSERT INTO entries (exercise_name, sets, reps, weight_kg, date, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            entry.exerciseName,
            entry.sets,
            entry.reps,
            entry.weightKg,
            entry.date,
            now().toISOString(),
          ],
        );
        notify();
        return { id: result.lastInsertRowId, ...entry };
      }),

    update: (id, entry) =>
      guard('update', async () => {
        const result = await db.run(
          `UPDATE entries SET exercise_name = ?, sets = ?, reps = ?, weight_kg = ?, date = ? WHERE id = ?`,
          [entry.exerciseName, entry.sets, entry.reps, entry.weightKg, entry.date, id],
        );
        if (result.changes === 0) throw new DbError(`Entry ${id} no longer exists.`);
        notify();
        return { id, ...entry };
      }),

    remove: (id) =>
      guard('remove', async () => {
        await db.run('DELETE FROM entries WHERE id = ?', [id]);
        notify();
      }),

    getById: (id) =>
      guard('getById', async () => {
        const row = await db.first<unknown>(`SELECT ${COLUMNS} FROM entries WHERE id = ?`, [id]);
        return row === null ? null : toEntry(row);
      }),

    getByDateRange: (start, end) =>
      query(
        'getByDateRange',
        `SELECT ${COLUMNS} FROM entries WHERE date BETWEEN ? AND ? ORDER BY date, id`,
        [start, end],
      ),

    getByExercise: (name) =>
      query(
        'getByExercise',
        `SELECT ${COLUMNS} FROM entries WHERE ${BY_NAME} ORDER BY date DESC, id DESC`,
        [name],
      ),

    getAll: () => query('getAll', `SELECT ${COLUMNS} FROM entries ORDER BY date, id`),

    distinctExerciseNames: () =>
      guard('distinctExerciseNames', async () => {
        // SQLite returns bare columns from the row holding MAX(date), i.e. the latest spelling.
        const rows = await db.all<{ exercise_name: unknown }>(
          `SELECT exercise_name, MAX(date) AS last_date FROM entries
           GROUP BY exercise_name COLLATE NOCASE ORDER BY last_date DESC, exercise_name COLLATE NOCASE`,
        );
        return rows.map((row) => {
          if (typeof row.exercise_name !== 'string')
            throw new DbError('Found a corrupt entry in the database.', row);
          return row.exercise_name;
        });
      }),

    lastForExercise: (name) =>
      guard('lastForExercise', async () => {
        const row = await db.first<unknown>(
          `SELECT ${COLUMNS} FROM entries WHERE ${BY_NAME} ORDER BY date DESC, id DESC LIMIT 1`,
          [name],
        );
        return row === null ? null : toEntry(row);
      }),

    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
