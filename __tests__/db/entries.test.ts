/** @jest-environment node */
import { createEntriesRepository, type EntriesRepository } from '@/db/entries';
import { DbError } from '@/db/errors';
import { runMigrations } from '@/db/migrations';
import type { NewEntry } from '@/lib/types';
import { createTestExecutor } from '../helpers/sqliteExecutor';

const base: NewEntry = {
  exerciseName: 'Bench Press',
  sets: 3,
  reps: 10,
  weightKg: 42.5,
  date: '2026-11-16',
};

async function setup() {
  const db = createTestExecutor();
  await runMigrations(db);
  const repo: EntriesRepository = createEntriesRepository(
    db,
    () => new Date(Date.UTC(2026, 10, 17, 12)),
  );
  return { db, repo };
}

describe('add / update / remove', () => {
  it('adds an entry and returns it with an id; round-trips decimals and null weight', async () => {
    const { repo } = await setup();
    const a = await repo.add(base);
    const b = await repo.add({ ...base, exerciseName: 'Push-ups', weightKg: null });
    expect(a.id).toBeGreaterThan(0);
    expect(b.id).toBeGreaterThan(a.id);
    expect(await repo.getAll()).toEqual([a, b]);
    expect((await repo.getAll())[0].weightKg).toBe(42.5);
    expect((await repo.getAll())[1].weightKg).toBeNull();
  });

  it('stores hostile names verbatim (parameterised queries)', async () => {
    const { repo, db } = await setup();
    const name = `O'Brien's "Press"; DROP TABLE entries;--`;
    await repo.add({ ...base, exerciseName: name });
    expect((await repo.getAll())[0].exerciseName).toBe(name);
    expect((await db.all('SELECT * FROM entries')).length).toBe(1);
  });

  it('updates every field, including the date', async () => {
    const { repo } = await setup();
    const a = await repo.add(base);
    const updated = await repo.update(a.id, {
      exerciseName: 'Squat',
      sets: 4,
      reps: 8,
      weightKg: 65,
      date: '2026-11-23',
    });
    expect(updated).toEqual({
      id: a.id,
      exerciseName: 'Squat',
      sets: 4,
      reps: 8,
      weightKg: 65,
      date: '2026-11-23',
    });
    expect(await repo.getAll()).toEqual([updated]);
  });

  it('rejects updating a missing entry with a DbError', async () => {
    const { repo } = await setup();
    await expect(repo.update(999, base)).rejects.toBeInstanceOf(DbError);
  });

  it('removes only the requested entry', async () => {
    const { repo } = await setup();
    const a = await repo.add(base);
    const b = await repo.add({ ...base, exerciseName: 'Squat' });
    await repo.remove(a.id);
    expect(await repo.getAll()).toEqual([b]);
  });

  it('wraps constraint failures in a DbError and stores nothing', async () => {
    const { repo } = await setup();
    await expect(repo.add({ ...base, sets: 0 })).rejects.toBeInstanceOf(DbError);
    await expect(repo.add({ ...base, weightKg: -1 })).rejects.toBeInstanceOf(DbError);
    expect(await repo.getAll()).toEqual([]);
  });

  it('writes the audit timestamp from the injected clock', async () => {
    const { repo, db } = await setup();
    await repo.add(base);
    expect(
      (await db.first<{ created_at: string }>('SELECT created_at FROM entries'))?.created_at,
    ).toBe('2026-11-17T12:00:00.000Z');
  });
});

describe('getById', () => {
  it('returns the entry, or null once it is gone', async () => {
    const { repo } = await setup();
    const a = await repo.add(base);
    expect(await repo.getById(a.id)).toEqual(a);
    await repo.remove(a.id);
    expect(await repo.getById(a.id)).toBeNull();
    expect(await repo.getById(12345)).toBeNull();
  });
});

describe('queries', () => {
  it('getByDateRange is inclusive on both ends and ordered by date then id', async () => {
    const { repo } = await setup();
    const sun = await repo.add({ ...base, date: '2026-11-22' });
    await repo.add({ ...base, date: '2026-11-15' }); // previous Sunday: excluded
    await repo.add({ ...base, date: '2026-11-23' }); // next Monday: excluded
    const mon2 = await repo.add({ ...base, exerciseName: 'B', date: '2026-11-16' });
    const mon1 = await repo.add({ ...base, exerciseName: 'A', date: '2026-11-16' });
    const rows = await repo.getByDateRange('2026-11-16', '2026-11-22');
    expect(rows.map((r) => r.id)).toEqual([mon2.id, mon1.id, sun.id]);
  });

  it('getByDateRange works across month and year boundaries', async () => {
    const { repo } = await setup();
    await repo.add({ ...base, date: '2026-12-31' });
    await repo.add({ ...base, date: '2027-01-01' });
    await repo.add({ ...base, date: '2027-01-04' });
    expect((await repo.getByDateRange('2026-12-28', '2027-01-03')).length).toBe(2);
  });

  it('getByExercise matches case-insensitively, newest first', async () => {
    const { repo } = await setup();
    const old = await repo.add({ ...base, exerciseName: 'bench press', date: '2026-11-09' });
    const recent = await repo.add({ ...base, exerciseName: 'Bench Press', date: '2026-11-16' });
    await repo.add({ ...base, exerciseName: 'Squat' });
    const rows = await repo.getByExercise('BENCH PRESS');
    expect(rows.map((r) => r.id)).toEqual([recent.id, old.id]);
  });

  it('lastForExercise returns the most recent entry (ties go to the later id), or null', async () => {
    const { repo } = await setup();
    expect(await repo.lastForExercise('Squat')).toBeNull();
    await repo.add({ ...base, exerciseName: 'Squat', weightKg: 60, date: '2026-11-09' });
    const sameDayA = await repo.add({
      ...base,
      exerciseName: 'Squat',
      weightKg: 65,
      date: '2026-11-16',
    });
    const sameDayB = await repo.add({
      ...base,
      exerciseName: 'squat',
      weightKg: 70,
      date: '2026-11-16',
    });
    expect(sameDayA.id).toBeLessThan(sameDayB.id);
    expect(await repo.lastForExercise('SQUAT')).toEqual(sameDayB);
  });

  it('distinctExerciseNames: one spelling per exercise, latest spelling, most recent first', async () => {
    const { repo } = await setup();
    await repo.add({ ...base, exerciseName: 'squat', date: '2026-11-09' });
    await repo.add({ ...base, exerciseName: 'Squat', date: '2026-11-16' });
    await repo.add({ ...base, exerciseName: 'Pull-ups', date: '2026-11-20' });
    await repo.add({ ...base, exerciseName: 'Bench Press', date: '2026-11-10' });
    expect(await repo.distinctExerciseNames()).toEqual(['Pull-ups', 'Squat', 'Bench Press']);
  });

  it('returns empty results on an empty database', async () => {
    const { repo } = await setup();
    expect(await repo.getAll()).toEqual([]);
    expect(await repo.getByDateRange('2026-11-16', '2026-11-22')).toEqual([]);
    expect(await repo.distinctExerciseNames()).toEqual([]);
  });

  it('throws a DbError instead of returning a corrupt row', async () => {
    const { repo, db } = await setup();
    await db.run(
      `INSERT INTO entries (exercise_name, sets, reps, weight_kg, date, created_at) VALUES ('X', 3, 5, NULL, 'not-a-date', 'x')`,
    );
    await expect(repo.getAll()).rejects.toBeInstanceOf(DbError);
  });
});

describe('subscribe', () => {
  it('notifies after add, update and remove', async () => {
    const { repo } = await setup();
    const listener = jest.fn();
    repo.subscribe(listener);
    const a = await repo.add(base);
    expect(listener).toHaveBeenCalledTimes(1);
    await repo.update(a.id, { ...base, sets: 5 });
    expect(listener).toHaveBeenCalledTimes(2);
    await repo.remove(a.id);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('notifies after the write is visible to reads', async () => {
    const { repo } = await setup();
    let seen = -1;
    repo.subscribe(() => {
      void repo.getAll().then((rows) => {
        seen = rows.length;
      });
    });
    await repo.add(base);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(seen).toBe(1);
  });

  it('does not notify when a write fails', async () => {
    const { repo } = await setup();
    const listener = jest.fn();
    repo.subscribe(listener);
    await expect(repo.add({ ...base, sets: 0 })).rejects.toBeInstanceOf(DbError);
    await expect(repo.update(999, base)).rejects.toBeInstanceOf(DbError);
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying after unsubscribe, and supports several subscribers', async () => {
    const { repo } = await setup();
    const a = jest.fn();
    const b = jest.fn();
    const unsubscribeA = repo.subscribe(a);
    repo.subscribe(b);
    await repo.add(base);
    unsubscribeA();
    await repo.add(base);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
  });

  it('a throwing listener neither breaks the write nor the other listeners', async () => {
    const { repo } = await setup();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const after = jest.fn();
    repo.subscribe(() => {
      throw new Error('boom');
    });
    repo.subscribe(after);
    await expect(repo.add(base)).resolves.toBeDefined();
    expect(after).toHaveBeenCalledTimes(1);
    expect((await repo.getAll()).length).toBe(1);
    spy.mockRestore();
  });
});
