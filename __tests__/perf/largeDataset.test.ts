/** @jest-environment node */
import { summarizeExercises } from '@/lib/exercises';
import { csvFileName, entriesToCsv, parseCsv } from '@/lib/csv';
import { addDays } from '@/lib/dates';
import { weightSeries } from '@/lib/chart';
import { personalBests } from '@/lib/metrics';
import { weeklySeries } from '@/lib/progress';
import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import type { SqlExecutor } from '@/db/sql';
import { lastNWeekStarts, weekEnd } from '@/lib/weeks';
import { createTestExecutor } from '../helpers/sqliteExecutor';

// ~5,000 entries (PRD §10: the app must stay fast at this size). Timings here run on a
// laptop in Node, so they are generous regression budgets, not promises about a phone; the
// index checks are what really protect phone performance.
const COUNT = 5000;
const START = '2025-01-01';
const TODAY = '2026-11-17';
const NAMES = Array.from({ length: 40 }, (_, i) => `Exercise ${String(i).padStart(2, '0')}`);

interface Captured {
  sql: string;
  params: unknown[];
}

async function seed() {
  const db = createTestExecutor();
  await runMigrations(db);
  await db.transaction(async () => {
    for (let i = 0; i < COUNT; i++) {
      await db.run(
        `INSERT INTO entries (exercise_name, sets, reps, weight_kg, date, created_at) VALUES (?, ?, ?, ?, ?, 'x')`,
        [
          NAMES[i % NAMES.length],
          3 + (i % 3),
          5 + (i % 8),
          i % 7 === 0 ? null : 20 + (i % 60),
          addDays(START, i % 685),
        ],
      );
    }
  });
  const captured: Captured[] = [];
  const recording: SqlExecutor = {
    ...db,
    all: (sql, params) => {
      captured.push({ sql, params: params ?? [] });
      return db.all(sql, params);
    },
    first: (sql, params) => {
      captured.push({ sql, params: params ?? [] });
      return db.first(sql, params);
    },
  };
  return { db, repo: createEntriesRepository(recording), captured };
}

async function planFor(db: SqlExecutor, { sql, params }: Captured): Promise<string> {
  const rows = await db.all<{ detail: string }>(`EXPLAIN QUERY PLAN ${sql}`, params);
  return rows.map((r) => r.detail).join(' | ');
}

async function timed<T>(
  label: string,
  run: () => Promise<T> | T,
): Promise<{ result: T; ms: number }> {
  const t0 = performance.now();
  const result = await run();
  const ms = performance.now() - t0;
  console.info(`[perf] ${label}: ${ms.toFixed(1)} ms`);
  return { result, ms };
}

describe(`with ${COUNT} entries`, () => {
  it('seeds the expected amount of data', async () => {
    const { db } = await seed();
    expect((await db.first<{ n: number }>('SELECT COUNT(*) AS n FROM entries'))?.n).toBe(COUNT);
  });

  describe('queries use their indexes (no full table scans)', () => {
    it('week and date-range queries use the date index', async () => {
      const { db, repo, captured } = await seed();
      await repo.getByDateRange('2026-11-16', '2026-11-22');
      const plan = await planFor(db, captured[captured.length - 1] as Captured);
      expect(plan).toMatch(/idx_entries_date/);
      expect(plan).not.toMatch(/SCAN entries(?! USING)/);
    });

    it('exercise history and "last session" lookups use the name index', async () => {
      const { db, repo, captured } = await seed();
      await repo.getByExercise('exercise 07');
      expect(await planFor(db, captured[captured.length - 1] as Captured)).toMatch(
        /idx_entries_name/,
      );
      await repo.lastForExercise('EXERCISE 07');
      expect(await planFor(db, captured[captured.length - 1] as Captured)).toMatch(
        /idx_entries_name/,
      );
    });

    it('opening an entry by id uses the primary key', async () => {
      const { db, repo, captured } = await seed();
      await repo.getById(2500);
      expect(await planFor(db, captured[captured.length - 1] as Captured)).toMatch(
        /PRIMARY KEY|INTEGER PRIMARY/i,
      );
    });
  });

  describe('screens stay quick (regression budgets, Node)', () => {
    it('the per-day and per-week queries return only their own rows, fast', async () => {
      const { repo } = await seed();
      const day = await timed('getByDateRange (one day)', () =>
        repo.getByDateRange('2026-11-17', '2026-11-17'),
      );
      const week = await timed('getByDateRange (one week)', () =>
        repo.getByDateRange('2026-11-16', '2026-11-22'),
      );
      expect(week.result.length).toBeGreaterThan(day.result.length);
      expect(week.result.every((e) => e.date >= '2026-11-16' && e.date <= '2026-11-22')).toBe(true);
      expect(day.ms).toBeLessThan(100);
      expect(week.ms).toBeLessThan(100);
    });

    it('Progress: the 8-week query plus series and comparison', async () => {
      const { repo } = await seed();
      const first = lastNWeekStarts(TODAY, 8)[0] ?? TODAY;
      const { result, ms } = await timed('Progress (query + series)', async () => {
        const rows = await repo.getByDateRange(first, weekEnd(TODAY));
        return weeklySeries(rows, TODAY);
      });
      expect(result).toHaveLength(8);
      expect(ms).toBeLessThan(250);
    });

    it('Exercises: reading everything and summarising 40 exercises', async () => {
      const { repo } = await seed();
      const { result, ms } = await timed('Exercises list (getAll + summarise)', async () =>
        summarizeExercises(await repo.getAll()),
      );
      expect(result).toHaveLength(NAMES.length);
      expect(result.reduce((n, r) => n + r.entryCount, 0)).toBe(COUNT);
      expect(ms).toBeLessThan(750);
    });

    it('Exercise detail: history, records and chart series', async () => {
      const { repo } = await seed();
      const { result, ms } = await timed('Exercise detail', async () => {
        const entries = await repo.getByExercise('Exercise 03');
        return { entries, bests: personalBests(entries), series: weightSeries(entries) };
      });
      expect(result.entries).toHaveLength(COUNT / NAMES.length);
      expect(result.series.length).toBeLessThanOrEqual(30);
      expect(ms).toBeLessThan(250);
    });

    it('the log sheet: autocomplete names and the last-session prefill', async () => {
      const { repo } = await seed();
      const names = await timed('distinctExerciseNames', () => repo.distinctExerciseNames());
      const last = await timed('lastForExercise', () => repo.lastForExercise('exercise 12'));
      expect(names.result).toHaveLength(NAMES.length);
      expect(last.result?.exerciseName).toBe('Exercise 12');
      expect(names.ms).toBeLessThan(250);
      expect(last.ms).toBeLessThan(100);
    });

    it('CSV export builds and re-parses the whole database', async () => {
      const { repo } = await seed();
      const all = await repo.getAll();
      const built = await timed('entriesToCsv', () => entriesToCsv(all));
      const parsed = await timed('parseCsv', () => parseCsv(built.result));
      expect(parsed.result).toHaveLength(COUNT + 1);
      expect(csvFileName(TODAY)).toMatch(/\.csv$/);
      expect(built.ms).toBeLessThan(500);
      expect(parsed.ms).toBeLessThan(750);
    });

    it('adding one entry is quick even with a big table', async () => {
      const { repo } = await seed();
      const { ms } = await timed('add', () =>
        repo.add({ exerciseName: 'New', sets: 3, reps: 5, weightKg: 50, date: TODAY }),
      );
      expect(ms).toBeLessThan(100);
    });
  });
});
