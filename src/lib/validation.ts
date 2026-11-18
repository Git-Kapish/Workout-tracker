import {
  MAX_NAME_LENGTH,
  MAX_REPS,
  MAX_SETS,
  MAX_WEIGHT_DECIMALS,
  MAX_WEIGHT_KG,
} from './constants';
import { isValidDateString } from './dates';
import type { NewEntry } from './types';

export type Result<T, E> = { ok: true; value: T } | { ok: false; errors: E };

/** Raw form text, exactly as typed. */
export interface RawEntryInput {
  exerciseName: string;
  sets: string;
  reps: string;
  weight: string;
  date: string;
}

export type EntryField = keyof RawEntryInput;
export type EntryErrors = Partial<Record<EntryField, string>>;

/** Trim and collapse internal whitespace. Matching elsewhere is case-insensitive. */
export function normalizeExerciseName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

function parseCount(raw: string, label: string, max: number): Result<number, string> {
  const text = raw.trim();
  if (text === '') return { ok: false, errors: `Enter ${label}.` };
  if (!/^\d+$/.test(text)) return { ok: false, errors: `${label} must be a whole number.` };
  const n = Number(text);
  if (n < 1) return { ok: false, errors: `${label} must be at least 1.` };
  if (n > max) return { ok: false, errors: `${label} can be at most ${max}.` };
  return { ok: true, value: n };
}

/** Blank -> null (bodyweight). Accepts ',' or '.' as the decimal separator. */
export function parseWeightInput(raw: string): Result<number | null, string> {
  const text = raw.trim().replace(',', '.');
  if (text === '') return { ok: true, value: null };
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) {
    return { ok: false, errors: 'Weight must be a number, like 42.5.' };
  }
  const decimals = text.split('.')[1]?.length ?? 0;
  if (decimals > MAX_WEIGHT_DECIMALS) {
    return { ok: false, errors: `Use at most ${MAX_WEIGHT_DECIMALS} decimals.` };
  }
  const n = Number(text);
  if (n > MAX_WEIGHT_KG) return { ok: false, errors: `Weight can be at most ${MAX_WEIGHT_KG} kg.` };
  return { ok: true, value: n };
}

export function validateEntryInput(raw: RawEntryInput): Result<NewEntry, EntryErrors> {
  const errors: EntryErrors = {};

  const exerciseName = normalizeExerciseName(raw.exerciseName);
  if (exerciseName === '') errors.exerciseName = 'Enter an exercise name.';
  else if (exerciseName.length > MAX_NAME_LENGTH) {
    errors.exerciseName = `Name can be at most ${MAX_NAME_LENGTH} characters.`;
  }

  const sets = parseCount(raw.sets, 'Sets', MAX_SETS);
  if (!sets.ok) errors.sets = sets.errors;
  const reps = parseCount(raw.reps, 'Reps', MAX_REPS);
  if (!reps.ok) errors.reps = reps.errors;
  const weight = parseWeightInput(raw.weight);
  if (!weight.ok) errors.weight = weight.errors;
  if (!isValidDateString(raw.date)) errors.date = 'Pick a valid date.';

  if (!sets.ok || !reps.ok || !weight.ok || Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      exerciseName,
      sets: sets.value,
      reps: reps.value,
      weightKg: weight.value,
      date: raw.date,
    },
  };
}
