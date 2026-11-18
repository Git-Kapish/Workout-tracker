import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { EntryForm } from '@/components/EntryForm';
import { createEntriesRepository, type EntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { useEntryForm, type EntryFormState } from '@/hooks/useEntryForm';
import { RepositoryProvider } from '@/hooks/useRepository';
import type { Entry, NewEntry } from '@/lib/types';
import { createTestExecutor } from '../helpers/sqliteExecutor';

// useFocusEffect needs a navigator; the subscribe() path already covers refreshing here.
jest.mock('expo-router', () => ({ useFocusEffect: () => undefined }));

const TODAY = '2026-11-17';
const squat: NewEntry = {
  exerciseName: 'Squat',
  sets: 4,
  reps: 8,
  weightKg: 65,
  date: '2026-11-10',
};
const bench: NewEntry = {
  exerciseName: 'Bench Press',
  sets: 3,
  reps: 10,
  weightKg: 42.5,
  date: '2026-11-09',
};

interface HarnessProps {
  entry?: Entry;
  onSaved?: (e: Entry) => void;
  onDeleted?: () => void;
  onClose?: () => void;
  /** Lets a test call form methods directly, e.g. two saves inside one act(). */
  formRef?: { current: EntryFormState | null };
}

function Harness({ entry, onSaved, onDeleted, onClose = () => undefined, formRef }: HarnessProps) {
  const form = useEntryForm({ entry, initialDate: TODAY, onSaved, onDeleted });
  useEffect(() => {
    if (formRef) formRef.current = form;
  });
  return <EntryForm form={form} today={TODAY} onClose={onClose} />;
}

interface SetupOptions extends Omit<HarnessProps, 'entry'> {
  seed?: NewEntry[];
  /** Index into `seed`: render the form editing that entry. */
  edit?: number;
  wrap?: (repo: EntriesRepository) => EntriesRepository;
}

async function setup({ seed = [], edit, wrap = (r) => r, ...props }: SetupOptions = {}) {
  const db = createTestExecutor();
  await runMigrations(db);
  const real = createEntriesRepository(db);
  const seeded: Entry[] = [];
  for (const s of seed) seeded.push(await real.add(s));
  await render(
    <RepositoryProvider repository={wrap(real)}>
      <Harness {...props} entry={edit === undefined ? undefined : seeded[edit]} />
    </RepositoryProvider>,
  );
  return { repo: real, seeded };
}

const field = (label: string) => screen.getByLabelText(label);
const type = (label: string, text: string) => fireEvent.changeText(field(label), text);
const saveButton = () => screen.getByRole('button', { name: 'Save exercise' });

async function fillValid(name = 'Bench Press', sets = '3', reps = '10', weight = '42.5') {
  await type('Exercise', name);
  await type('Sets', sets);
  await type('Reps per set', reps);
  await type('Weight (kg)', weight);
}

describe('EntryForm: saving', () => {
  it('keeps Save disabled until the input is valid', async () => {
    await setup();
    expect(saveButton()).toBeDisabled();
    await type('Exercise', 'Bench Press');
    await type('Sets', '3');
    expect(saveButton()).toBeDisabled();
    await type('Reps per set', '10');
    expect(saveButton()).toBeEnabled(); // weight is optional
  });

  it('saves a normalised entry, then resets for the next exercise and shows a confirmation', async () => {
    const { repo } = await setup();
    await fillValid('  bench   press ', '3', '10', '42,5'); // comma decimal, messy name
    await fireEvent.press(saveButton());

    await waitFor(async () =>
      expect(await repo.getAll()).toEqual([
        { id: 1, exerciseName: 'bench press', sets: 3, reps: 10, weightKg: 42.5, date: TODAY },
      ]),
    );
    expect(await screen.findByText('Saved bench press · 3 × 10')).toBeOnTheScreen();
    expect(field('Exercise')).toHaveDisplayValue('');
    expect(field('Sets')).toHaveDisplayValue('');
    expect(saveButton()).toBeDisabled();
  });

  it('saves bodyweight exercises with a null weight', async () => {
    const { repo } = await setup();
    await fillValid('Pull-ups', '3', '6', '');
    await fireEvent.press(saveButton());
    await waitFor(async () => expect((await repo.getAll())[0]?.weightKg).toBeNull());
  });

  it('creates exactly one entry when Save fires twice before React re-renders (double tap)', async () => {
    const formRef: { current: EntryFormState | null } = { current: null };
    const { repo } = await setup({ formRef });
    await fillValid();
    const form = formRef.current;
    if (!form) throw new Error('form not captured');

    // Both calls happen inside one act(): the second sees the stale, still-enabled form,
    // exactly like a second tap landing in the same frame.
    await act(async () => {
      void form.save();
      void form.save();
    });

    await waitFor(async () => expect(await repo.getAll()).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 50)); // nothing late arrives
    expect(await repo.getAll()).toHaveLength(1);
  });

  it('disables Save and shows "Saving…" while the write is in flight', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await setup({
      wrap: (repo) => ({
        ...repo,
        add: async (entry) => {
          await gate;
          return repo.add(entry);
        },
      }),
    });
    await fillValid();
    await fireEvent.press(saveButton());

    expect(await screen.findByText('Saving…')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save exercise' })).toBeDisabled();

    release();
    await waitFor(() => expect(screen.queryByText('Saving…')).not.toBeOnTheScreen());
  });

  it('shows a friendly error and keeps what was typed when the save fails', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await setup({
      wrap: (repo) => ({
        ...repo,
        add: async () => {
          throw new Error('disk full');
        },
      }),
    });
    await fillValid();
    await fireEvent.press(saveButton());

    expect(await screen.findByText("Couldn't save. Try again.")).toBeOnTheScreen();
    expect(field('Exercise')).toHaveDisplayValue('Bench Press');
    expect(field('Sets')).toHaveDisplayValue('3');
    expect(saveButton()).toBeEnabled(); // can retry
    spy.mockRestore();
  });
});

describe('EntryForm: validation messages', () => {
  it('stays quiet on a pristine form, then explains each problem after the field is touched', async () => {
    await setup();
    expect(screen.queryByText('Enter an exercise name.')).not.toBeOnTheScreen();

    await type('Exercise', 'x');
    await type('Exercise', '   ');
    expect(await screen.findByText('Enter an exercise name.')).toBeOnTheScreen();

    await type('Sets', '0');
    expect(screen.getByText('Sets must be at least 1.')).toBeOnTheScreen();
    await type('Sets', '2.5');
    expect(screen.getByText('Sets must be a whole number.')).toBeOnTheScreen();
    await type('Sets', '51');
    expect(screen.getByText('Sets can be at most 50.')).toBeOnTheScreen();

    await type('Reps per set', '1001');
    expect(screen.getByText('Reps can be at most 1000.')).toBeOnTheScreen();

    await type('Weight (kg)', '-5');
    expect(screen.getByText('Weight must be a number, like 42.5.')).toBeOnTheScreen();
    await type('Weight (kg)', '1001');
    expect(screen.getByText('Weight can be at most 1000 kg.')).toBeOnTheScreen();

    expect(saveButton()).toBeDisabled();
  });

  it('clears a message once the value is fixed', async () => {
    await setup();
    await type('Sets', '0');
    expect(screen.getByText('Sets must be at least 1.')).toBeOnTheScreen();
    await type('Sets', '3');
    expect(screen.queryByText('Sets must be at least 1.')).not.toBeOnTheScreen();
  });

  it('rejects names over 60 characters', async () => {
    await setup();
    await type('Exercise', 'a'.repeat(61));
    expect(await screen.findByText('Name can be at most 60 characters.')).toBeOnTheScreen();
  });
});

describe('EntryForm: autocomplete and prefill', () => {
  it('suggests previous exercises case-insensitively and highlights the match', async () => {
    await setup({ seed: [squat, bench] });
    expect(await screen.findByRole('button', { name: 'Use Squat' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Use Bench Press' })).toBeOnTheScreen();

    await type('Exercise', 'sq');
    expect(screen.getByRole('button', { name: 'Use Squat' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Use Bench Press' })).not.toBeOnTheScreen();

    await type('Exercise', 'SQUAT');
    expect(screen.getByRole('button', { name: 'Use Squat' })).toBeSelected();
  });

  it('prefills sets, reps and weight from the last session when a suggestion is tapped', async () => {
    await setup({ seed: [{ ...squat, weightKg: 60, date: '2026-11-03' }, squat] });
    await fireEvent.press(await screen.findByRole('button', { name: 'Use Squat' }));

    await waitFor(() => expect(field('Sets')).toHaveDisplayValue('4'));
    expect(field('Reps per set')).toHaveDisplayValue('8');
    expect(field('Weight (kg)')).toHaveDisplayValue('65'); // the most recent, not the 60 kg one
    expect(screen.getByText('Prefilled from your last Squat session.')).toBeOnTheScreen();
    expect(saveButton()).toBeEnabled(); // 3 taps: +, chip, save
  });

  it('prefills when the typed name matches an exercise ignoring case, and uses its spelling', async () => {
    await setup({ seed: [bench] });
    await screen.findByRole('button', { name: 'Use Bench Press' });
    await type('Exercise', 'bench press');
    await waitFor(() => expect(field('Sets')).toHaveDisplayValue('3'));
    expect(field('Weight (kg)')).toHaveDisplayValue('42.5');
    expect(screen.getByText('Prefilled from your last Bench Press session.')).toBeOnTheScreen();
  });

  it('never overwrites numbers the user already typed when the name matches', async () => {
    await setup({ seed: [squat] });
    await screen.findByRole('button', { name: 'Use Squat' });
    await type('Sets', '9');
    await type('Exercise', 'squat');
    await new Promise((r) => setTimeout(r, 50));
    expect(field('Sets')).toHaveDisplayValue('9');
    expect(field('Reps per set')).toHaveDisplayValue('');
  });

  it('does not prefill a brand-new exercise', async () => {
    await setup({ seed: [squat] });
    await screen.findByRole('button', { name: 'Use Squat' });
    await type('Exercise', 'Deadlift');
    await new Promise((r) => setTimeout(r, 50));
    expect(field('Sets')).toHaveDisplayValue('');
  });
});

describe('EntryForm: editing and deleting', () => {
  it('opens with the entry, updates it in place, and reports the save', async () => {
    const onSaved = jest.fn();
    const { repo, seeded } = await setup({ seed: [squat], edit: 0, onSaved });
    const edit = seeded[0];

    expect(screen.getByText('Edit exercise')).toBeOnTheScreen();
    expect(field('Exercise')).toHaveDisplayValue('Squat');
    expect(field('Weight (kg)')).toHaveDisplayValue('65');

    await type('Sets', '5');
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(async () => expect((await repo.getAll())[0]?.sets).toBe(5));
    expect(await repo.getAll()).toHaveLength(1); // updated, not duplicated
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: edit.id, sets: 5 }));
  });

  it('asks for confirmation before deleting, and keeps the entry on Cancel', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const onDeleted = jest.fn();
    const { repo } = await setup({ seed: [squat], edit: 0, onDeleted });

    await fireEvent.press(screen.getByRole('button', { name: 'Delete entry' }));
    expect(alert).toHaveBeenCalledTimes(1);
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    await act(async () => {
      buttons.find((b) => b.text === 'Cancel')?.onPress?.();
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(await repo.getAll()).toHaveLength(1);
    expect(onDeleted).not.toHaveBeenCalled();
    alert.mockRestore();
  });

  it('deletes only after the user confirms', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const onDeleted = jest.fn();
    const { repo } = await setup({ seed: [squat], edit: 0, onDeleted });

    await fireEvent.press(screen.getByRole('button', { name: 'Delete entry' }));
    expect(await repo.getAll()).toHaveLength(1); // nothing happens before confirming
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    await act(async () => {
      buttons.find((b) => b.text === 'Delete')?.onPress?.();
    });

    await waitFor(async () => expect(await repo.getAll()).toHaveLength(0));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    alert.mockRestore();
  });
});
