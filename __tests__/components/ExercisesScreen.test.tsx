import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ExercisesScreen from '../../app/(tabs)/exercises';
import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { RepositoryProvider } from '@/hooks/useRepository';
import { encodeExerciseSlug } from '@/lib/exerciseRoute';
import type { NewEntry } from '@/lib/types';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn() },
  useFocusEffect: () => undefined,
}));
jest.mock('@/hooks/useNow', () => ({
  useToday: () => '2026-11-17',
  useNow: () => new Date(2026, 10, 17, 18),
}));

const e = (
  exerciseName: string,
  date: string,
  sets: number,
  reps: number,
  weightKg: number | null,
): NewEntry => ({ exerciseName, date, sets, reps, weightKg });

// The six exercises drawn in docs/design/screens/06-exercises.png.
const DESIGN: NewEntry[] = [
  e('Bench Press', '2026-11-09', 3, 10, 40),
  e('Bench Press', '2026-11-16', 3, 10, 42.5),
  e('Squat', '2026-11-17', 4, 8, 65),
  e('Pull-ups', '2026-11-17', 3, 6, null),
  e('Push-ups', '2026-11-16', 3, 18, null),
  e('Deadlift', '2026-11-13', 1, 5, 90),
  e('Overhead Press', '2026-11-12', 3, 8, 30),
];

async function renderList(seed: NewEntry[] = DESIGN) {
  const db = createTestExecutor();
  await runMigrations(db);
  const repo = createEntriesRepository(db);
  for (const entry of seed) await repo.add(entry);
  const Providers = ({ children }: { children: ReactNode }) => (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <RepositoryProvider repository={repo}>{children}</RepositoryProvider>
    </SafeAreaProvider>
  );
  await render(<ExercisesScreen />, { wrapper: Providers });
  await screen.findByText('exercises.');
  return { repo };
}

const search = (text: string) =>
  fireEvent.changeText(screen.getByLabelText('Search exercises'), text);
const rowNames = () =>
  screen
    .queryAllByRole('button')
    .map((b) => String(b.props.accessibilityLabel ?? ''))
    .filter((l) => l.includes('Last done'))
    .map((l) => l.split('.')[0]);

beforeEach(() => jest.clearAllMocks());

describe('Exercises screen (docs/design/screens/06-exercises.png)', () => {
  it('lists every exercise once, with the count, last-done date and best', async () => {
    await renderList();
    expect(await screen.findByText('6 EXERCISES')).toBeOnTheScreen();
    expect(screen.getByText('Bench Press')).toBeOnTheScreen(); // two entries, one row
    expect(screen.getAllByText('Last done Nov 17')).toHaveLength(2); // Squat, Pull-ups
    expect(screen.getAllByText('Last done Nov 16')).toHaveLength(2); // Bench Press, Push-ups
    expect(screen.getByText('42.5 kg')).toBeOnTheScreen(); // Bench best weight
    expect(screen.getByText('65 kg')).toBeOnTheScreen();
    expect(screen.getByText('90 kg')).toBeOnTheScreen();
    expect(screen.getByText('30 kg')).toBeOnTheScreen();
  });

  it('shows best reps instead for bodyweight exercises', async () => {
    await renderList();
    await screen.findByText('6 EXERCISES');
    expect(screen.getByText('6 reps')).toBeOnTheScreen(); // Pull-ups
    expect(screen.getByText('18 reps')).toBeOnTheScreen(); // Push-ups
  });

  it('orders by most recently done', async () => {
    await renderList();
    await screen.findByText('6 EXERCISES');
    expect(rowNames()).toEqual([
      'Pull-ups', // Nov 17 (alphabetical tie-break before Squat)
      'Squat',
      'Bench Press', // Nov 16
      'Push-ups',
      'Deadlift', // Nov 13
      'Overhead Press', // Nov 12
    ]);
  });

  it('searches case-insensitively and keeps the full count visible', async () => {
    await renderList();
    await screen.findByText('6 EXERCISES');
    await search('PRESS');
    expect(await screen.findByText('2 OF 6 EXERCISES')).toBeOnTheScreen();
    expect(rowNames()).toEqual(['Bench Press', 'Overhead Press']);
    expect(screen.queryByText('Squat')).not.toBeOnTheScreen();

    await search('  pull');
    expect(await screen.findByText('1 OF 6 EXERCISES')).toBeOnTheScreen();
    expect(rowNames()).toEqual(['Pull-ups']);

    await search('');
    expect(await screen.findByText('6 EXERCISES')).toBeOnTheScreen();
  });

  it('says "No matches" when nothing fits the search', async () => {
    await renderList();
    await screen.findByText('6 EXERCISES');
    await search('zzz');
    expect(await screen.findByText('No matches')).toBeOnTheScreen();
    expect(screen.getByText('Nothing matches "zzz".')).toBeOnTheScreen();
  });

  it('opens the exercise detail for the tapped row, using a router-safe slug', async () => {
    await renderList();
    await fireEvent.press(await screen.findByRole('button', { name: /^Pull-ups\./ }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/exercise/[name]',
      params: { name: encodeExerciseSlug('Pull-ups') },
    });
  });

  it('merges names that differ only by case, showing the latest spelling', async () => {
    await renderList([e('squat', '2026-11-09', 3, 5, 60), e('Squat', '2026-11-16', 3, 5, 65)]);
    expect(await screen.findByText('1 EXERCISE')).toBeOnTheScreen();
    expect(screen.getByText('Squat')).toBeOnTheScreen();
    expect(screen.getByText('65 kg')).toBeOnTheScreen();
  });

  it('shows an empty state with a way to log when nothing has been logged', async () => {
    await renderList([]);
    expect(await screen.findByText('No exercises yet')).toBeOnTheScreen();
    expect(screen.queryByText(/EXERCISES?$/)).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Log an exercise' }));
    expect(router.push).toHaveBeenCalledWith('/log');
  });

  it('updates when an exercise is logged elsewhere', async () => {
    const { repo } = await renderList([e('Squat', '2026-11-16', 3, 5, 60)]);
    await screen.findByText('1 EXERCISE');
    await repo.add(e('Deadlift', '2026-11-17', 1, 5, 100));
    await waitFor(() => expect(screen.getByText('2 EXERCISES')).toBeOnTheScreen());
    expect(screen.getByText('100 kg')).toBeOnTheScreen();
  });
});
