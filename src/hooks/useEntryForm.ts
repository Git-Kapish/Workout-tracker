import { useCallback, useMemo, useRef, useState } from 'react';

import { findExercise, sameExercise, suggestExercises } from '@/lib/exercises';
import { formatSetsReps } from '@/lib/format';
import type { DateString, Entry } from '@/lib/types';
import {
  validateEntryInput,
  type EntryErrors,
  type EntryField,
  type RawEntryInput,
} from '@/lib/validation';

import { useExerciseNames } from './queries';
import { useEntryMutations } from './useEntryMutations';
import { haptics } from '@/platform/haptics';
import { useRepository } from './useRepository';

interface Options {
  /** Present = editing that entry (no prefill); absent = adding. */
  entry?: Entry;
  initialDate: DateString;
  onSaved?: (entry: Entry) => void;
  onDeleted?: () => void;
}

const NUMERIC_FIELDS: readonly EntryField[] = ['sets', 'reps', 'weight'];

const emptyFields = (date: DateString): RawEntryInput => ({
  exerciseName: '',
  sets: '',
  reps: '',
  weight: '',
  date,
});

const fieldsFromEntry = (e: Entry): RawEntryInput => ({
  exerciseName: e.exerciseName,
  sets: String(e.sets),
  reps: String(e.reps),
  weight: e.weightKg === null ? '' : String(e.weightKg),
  date: e.date,
});

/** All form behaviour lives here; the EntryForm component only renders it. */
export function useEntryForm({ entry, initialDate, onSaved, onDeleted }: Options) {
  const repository = useRepository();
  const mutations = useEntryMutations();
  const names = useExerciseNames();
  const mode = entry ? 'edit' : 'add';

  const [fields, setFields] = useState<RawEntryInput>(() =>
    entry ? fieldsFromEntry(entry) : emptyFields(initialDate),
  );
  const [touched, setTouched] = useState<Partial<Record<EntryField, true>>>({});
  const [prefilledFrom, setPrefilledFrom] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  // Prefill bookkeeping (refs: they steer behaviour but never need a re-render).
  const typedName = useRef(fields.exerciseName);
  const numbersAreUntouched = useRef(true); // sets/reps/weight are blank or still the prefilled values
  const lastPrefillKey = useRef<string | null>(null);

  const validation = useMemo(() => validateEntryInput(fields), [fields]);
  const allErrors: EntryErrors = validation.ok ? {} : validation.errors;
  const errors: EntryErrors = {};
  for (const field of Object.keys(allErrors) as EntryField[]) {
    if (touched[field]) errors[field] = allErrors[field];
  }

  const prefill = useCallback(
    async (name: string) => {
      let last: Entry | null = null;
      try {
        last = await repository.lastForExercise(name);
      } catch (e) {
        console.error('Prefill lookup failed', e); // not worth interrupting the user for
        return;
      }
      // The user kept typing while we looked it up.
      if (!last || !sameExercise(typedName.current, name)) return;
      setFields((f) => ({
        ...f,
        sets: String(last.sets),
        reps: String(last.reps),
        weight: last.weightKg === null ? '' : String(last.weightKg),
      }));
      setPrefilledFrom(last.exerciseName);
      numbersAreUntouched.current = true;
      lastPrefillKey.current = last.exerciseName.toLowerCase();
    },
    [repository],
  );

  const setField = useCallback(
    (field: EntryField, value: string) => {
      setFields((f) => ({ ...f, [field]: value }));
      setTouched((t) => ({ ...t, [field]: true }));
      setSavedNote(null);

      if (NUMERIC_FIELDS.includes(field)) {
        numbersAreUntouched.current = false;
        return;
      }
      if (field !== 'exerciseName') return;

      typedName.current = value;
      setPrefilledFrom(null);
      if (mode === 'edit') return;
      const match = findExercise(names, value);
      if (!match) {
        lastPrefillKey.current = null;
        return;
      }
      const blank = fields.sets === '' && fields.reps === '' && fields.weight === '';
      if (
        (blank || numbersAreUntouched.current) &&
        lastPrefillKey.current !== match.toLowerCase()
      ) {
        void prefill(match);
      }
    },
    [mode, names, fields.sets, fields.reps, fields.weight, prefill],
  );

  /** Tapping a suggestion chip is explicit intent: always fill from the last session. */
  const selectExercise = useCallback(
    (name: string) => {
      typedName.current = name;
      setFields((f) => ({ ...f, exerciseName: name }));
      setTouched((t) => ({ ...t, exerciseName: true }));
      setSavedNote(null);
      setPrefilledFrom(null);
      if (mode === 'add') void prefill(name);
    },
    [mode, prefill],
  );

  const touch = useCallback(
    (field: EntryField) => setTouched((t) => ({ ...t, [field]: true })),
    [],
  );

  const save = useCallback(async (): Promise<Entry | null> => {
    if (!validation.ok) {
      setTouched({ exerciseName: true, sets: true, reps: true, weight: true, date: true });
      return null;
    }
    const saved = entry
      ? await mutations.update(entry.id, validation.value)
      : await mutations.add(validation.value);
    if (!saved) return null;

    if (!entry) {
      // Ready for the next exercise: clear everything but the date (PRD FR-10).
      setFields(emptyFields(saved.date));
      setTouched({});
      setPrefilledFrom(null);
      setSavedNote(`Saved ${saved.exerciseName} · ${formatSetsReps(saved.sets, saved.reps)}`);
      typedName.current = '';
      numbersAreUntouched.current = true;
      lastPrefillKey.current = null;
    }
    haptics.success();
    onSaved?.(saved);
    return saved;
  }, [validation, entry, mutations, onSaved]);

  /** Callers must have asked for confirmation first. */
  const remove = useCallback(async (): Promise<boolean> => {
    if (!entry) return false;
    const deleted = await mutations.remove(entry.id);
    if (deleted) {
      haptics.warning();
      onDeleted?.();
    }
    return deleted;
  }, [entry, mutations, onDeleted]);

  const suggestions = useMemo(
    () => suggestExercises(names, fields.exerciseName),
    [names, fields.exerciseName],
  );

  return {
    mode,
    fields,
    errors,
    setField,
    touch,
    selectExercise,
    suggestions,
    /** Note under the title: prefill source, or the confirmation after a save. */
    note:
      savedNote ?? (prefilledFrom ? `Prefilled from your last ${prefilledFrom} session.` : null),
    savedNote,
    canSave: validation.ok && !mutations.saving,
    saving: mutations.saving,
    saveError: mutations.error,
    save,
    remove,
  };
}

export type EntryFormState = ReturnType<typeof useEntryForm>;
