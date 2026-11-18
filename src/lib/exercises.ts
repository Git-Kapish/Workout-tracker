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
