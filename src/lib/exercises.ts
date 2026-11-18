import { personalBests, type PersonalBests } from './metrics';
import type { DateString, Entry } from './types';
import { normalizeExerciseName } from './validation';

const key = (name: string): string => normalizeExerciseName(name).toLowerCase();

/** Same exercise = equal after trimming, collapsing whitespace and ignoring case. */
export function sameExercise(a: string, b: string): boolean {
  return key(a) === key(b);
}

/**
 * Autocomplete: names starting with the query first, then names containing it, keeping the
 * incoming (most recently used first) order inside each group. An empty query returns the
 * most recent names.
 */
export function suggestExercises(names: readonly string[], query: string, limit = 8): string[] {
  const q = key(query);
  if (q === '') return names.slice(0, limit);
  const starts: string[] = [];
  const contains: string[] = [];
  for (const name of names) {
    const k = key(name);
    if (k.startsWith(q)) starts.push(name);
    else if (k.includes(q)) contains.push(name);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** The existing spelling of `typed`, or undefined if it is a new exercise. */
export function findExercise(names: readonly string[], typed: string): string | undefined {
  return names.find((name) => sameExercise(name, typed));
}

export interface ExerciseSummary {
  /** The spelling used most recently. */
  name: string;
  lastDate: DateString;
  entryCount: number;
  bests: PersonalBests;
}

/**
 * One row per exercise (names that differ only by case or spacing are one exercise), most
 * recently done first, ties alphabetical.
 */
export function summarizeExercises(entries: readonly Entry[]): ExerciseSummary[] {
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const k = key(entry.exerciseName);
    const group = groups.get(k);
    if (group) group.push(entry);
    else groups.set(k, [entry]);
  }

  const summaries: ExerciseSummary[] = [];
  for (const group of groups.values()) {
    const latest = group.reduce((a, b) =>
      b.date > a.date || (b.date === a.date && b.id > a.id) ? b : a,
    );
    summaries.push({
      name: latest.exerciseName,
      lastDate: latest.date,
      entryCount: group.length,
      bests: personalBests(group),
    });
  }
  return summaries.sort(
    (a, b) =>
      (a.lastDate < b.lastDate ? 1 : a.lastDate > b.lastDate ? -1 : 0) ||
      key(a.name).localeCompare(key(b.name)),
  );
}

/** Case-insensitive "contains" filter that keeps the incoming order. */
export function searchExercises<T extends { name: string }>(
  items: readonly T[],
  query: string,
): T[] {
  const q = key(query);
  return q === '' ? [...items] : items.filter((item) => key(item.name).includes(q));
}

/**
 * The single "Best" figure on the list: the heaviest weight, or for bodyweight exercises the
 * most reps in one set.
 */
export function bestOf(bests: PersonalBests): { kind: 'weight' | 'reps'; value: number } | null {
  if (bests.maxWeightKg !== null) return { kind: 'weight', value: bests.maxWeightKg };
  if (bests.maxRepsPerSet !== null) return { kind: 'reps', value: bests.maxRepsPerSet };
  return null;
}
