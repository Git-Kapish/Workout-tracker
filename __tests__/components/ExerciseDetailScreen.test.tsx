import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ExerciseDetailRoute from '../../app/(tabs)/exercise/[name]';
import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { RepositoryProvider } from '@/hooks/useRepository';
import { encodeExerciseSlug } from '@/lib/exerciseRoute';
import type { NewEntry } from '@/lib/types';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn() },
  useFocusEffect: () => undefined,
  useLocalSearchParams: jest.fn(),
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

// Bench Press as in docs/design/screens/07-exercise-detail.png.
const BENCH: NewEntry[] = [
  e('Bench Press', '2026-09-28', 3, 8, 37.5),
  e('Bench Press', '2026-10-05', 3, 8, 37.5),
  e('Bench Press', '2026-10-12', 3, 8, 40),
  e('Bench Press', '2026-10-19', 3, 8, 40),
  e('Bench Press', '2026-10-26', 3, 8, 40),
  e('Bench Press', '2026-11-02', 3, 10, 40),
  e('Bench Press', '2026-11-09', 3, 10, 40),
  e('Bench Press', '2026-11-16', 3, 10, 42.5),
  e('Squat', '2026-11-17', 4, 8, 65), // other exercise: must not leak in
];

async function renderWithParams(params: Record<string, string>, seed: NewEntry[] = BENCH) {
  jest.mocked(useLocalSearchParams).mockReturnValue(params as never);
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
  await render(<ExerciseDetailRoute />, { wrapper: Providers });
  return { repo };
}

const renderDetail = (name: string, seed: NewEntry[] = BENCH) =>
  renderWithParams({ name: encodeExerciseSlug(name) }, seed);

beforeEach(() => jest.clearAllMocks());

describe('Exercise detail (docs/design/screens/07-exercise-detail.png)', () => {
  it('shows the name and the three personal records', async () => {
    await renderDetail('Bench Press');
    expect(await screen.findByLabelText('max weight: 42.5 kg')).toBeOnTheScreen();
    expect(screen.getByLabelText('best volume: 1,275 kg')).toBeOnTheScreen();
    expect(screen.getByLabelText('max reps/set: 10')).toBeOnTheScreen();
    expect(screen.getByText('Bench Press')).toBeOnTheScreen();
  });

  it('describes the weight chart and labels its first, middle and last dates', async () => {
    await renderDetail('Bench Press');
    expect(
      await screen.findByLabelText(
        'Bench Press weight rose from 37.5 kg to 42.5 kg over 8 sessions',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('Weight over time')).toBeOnTheScreen();
    // Axis labels are SVG text (not queryable); their values and positions are asserted in the
    // layoutLineChart tests against the design's coordinates.
  });

  it('lists the history newest first with date, sets x reps, weight and volume', async () => {
    await renderDetail('Bench Press');
    await screen.findByText('HISTORY');
    const labels = screen
      .getAllByRole('button')
      .map((b) => String(b.props.accessibilityLabel ?? ''))
      .filter((l) => l.endsWith('Edit'));
    expect(labels).toHaveLength(8);
    expect(labels[0]).toBe('Nov 16, 3 × 10 · 42.5 kg, 1,275 kg. Edit');
    expect(labels[1]).toBe('Nov 9, 3 × 10 · 40 kg, 1,200 kg. Edit');
    expect(labels[2]).toBe('Nov 2, 3 × 10 · 40 kg, 1,200 kg. Edit');
    expect(labels[3]).toBe('Oct 26, 3 × 8 · 40 kg, 960 kg. Edit'); // matches the design's fourth row
    expect(labels[7]).toBe('Sep 28, 3 × 8 · 37.5 kg, 900 kg. Edit');
  });

  it('opens an entry for editing from the history', async () => {
    const { repo } = await renderDetail('Bench Press');
    const newest = (await repo.getByExercise('Bench Press'))[0];
    await fireEvent.press(await screen.findByRole('button', { name: /^Nov 16, 3 × 10/ }));
    expect(router.push).toHaveBeenCalledWith(`/log?id=${newest?.id}`);
  });

  it('goes back to the exercises list', async () => {
    await renderDetail('Bench Press');
    await fireEvent.press(await screen.findByRole('button', { name: 'Back to exercises' }));
    expect(router.navigate).toHaveBeenCalledWith('/exercises');
  });

  it('shows dashes and a hint for a bodyweight exercise (no weight or volume records)', async () => {
    await renderDetail('Pull-ups', [
      e('Pull-ups', '2026-11-17', 3, 6, null),
      e('Pull-ups', '2026-11-10', 3, 5, null),
    ]);
    expect(await screen.findByLabelText('max weight: —')).toBeOnTheScreen();
    expect(screen.getByLabelText('best volume: —')).toBeOnTheScreen();
    expect(screen.getByLabelText('max reps/set: 6')).toBeOnTheScreen();
    expect(
      screen.getByText('Log this exercise with a weight to see how it changes over time.'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Nov 17, 3 × 6 · bodyweight, no weight. Edit')).toBeOnTheScreen();
  });

  it('copes with a single session', async () => {
    await renderDetail('Squat', [e('Squat', '2026-11-17', 4, 8, 65)]);
    expect(await screen.findByLabelText('Squat: 65 kg, one session')).toBeOnTheScreen();
    expect(screen.getByLabelText('max weight: 65 kg')).toBeOnTheScreen();
  });

  it('finds an exercise whatever the casing of the stored name, using its latest spelling', async () => {
    await renderDetail('SQUAT', [
      e('squat', '2026-11-09', 3, 5, 60),
      e('Squat', '2026-11-16', 3, 5, 65),
    ]);
    expect(await screen.findByText('Squat')).toBeOnTheScreen();
    expect(screen.getByLabelText('max weight: 65 kg')).toBeOnTheScreen();
  });

  it.each(['100% Effort', 'Press/Dip?', 'Épaulé 🏋️'])(
    'opens exercises with awkward names (%s)',
    async (name) => {
      await renderDetail(name, [e(name, '2026-11-16', 3, 5, 20)]);
      expect(await screen.findByLabelText('max weight: 20 kg')).toBeOnTheScreen();
      expect(screen.getByText(name)).toBeOnTheScreen();
    },
  );

  it('says so when the exercise no longer has any entries', async () => {
    await renderDetail('Deadlift');
    expect(await screen.findByText('No entries for this exercise')).toBeOnTheScreen();
  });

  it('shows "Exercise not found" when the link has no name', async () => {
    await renderWithParams({});
    expect(await screen.findByText('Exercise not found')).toBeOnTheScreen();
  });

  it('shows "Exercise not found" when the link is not a valid slug', async () => {
    await renderWithParams({ name: 'not-a-slug' });
    expect(await screen.findByText('Exercise not found')).toBeOnTheScreen();
    const backButtons = screen.getAllByRole('button', { name: 'Back to exercises' });
    expect(backButtons).toHaveLength(2); // header arrow and the empty-state action
    await fireEvent.press(backButtons[1] ?? backButtons[0]);
    expect(router.navigate).toHaveBeenCalledWith('/exercises');
  });

  it('updates when an entry is added', async () => {
    const { repo } = await renderDetail('Bench Press');
    await screen.findByLabelText('max weight: 42.5 kg');
    await repo.add(e('Bench Press', '2026-11-17', 1, 3, 100));
    await waitFor(() => expect(screen.getByLabelText('max weight: 100 kg')).toBeOnTheScreen());
  });
});
