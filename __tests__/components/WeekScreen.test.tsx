import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import WeekScreen from '../../app/(tabs)/week';
import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { RepositoryProvider } from '@/hooks/useRepository';
import type { NewEntry } from '@/lib/types';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useFocusEffect: () => undefined,
}));
jest.mock('@/hooks/useNow', () => ({
  useToday: () => '2026-11-17', // a Tuesday
  useNow: () => new Date(2026, 10, 17, 18),
}));

const e = (
  exerciseName: string,
  date: string,
  sets: number,
  reps: number,
  kg: number | null,
): NewEntry => ({
  exerciseName,
  date,
  sets,
  reps,
  weightKg: kg,
});

// PRD §7.5, as drawn in docs/design/screens/04-week.png.
const FIXTURE: NewEntry[] = [
  e('Bench Press', '2026-11-16', 3, 10, 42.5),
  e('Push-ups', '2026-11-16', 3, 18, null),
  e('Squat', '2026-11-17', 4, 8, 65),
  e('Pull-ups', '2026-11-17', 3, 6, null),
  e('Old', '2026-11-10', 1, 5, 20), // last week, Tuesday
];

async function renderWeek(seed: NewEntry[] = FIXTURE) {
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
  await render(<WeekScreen />, { wrapper: Providers });
  await screen.findByText('Tuesday, Nov 17 · Today');
  return { repo };
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));

beforeEach(() => jest.clearAllMocks());

describe('Week screen (docs/design/screens/04-week.png)', () => {
  it('opens on the current week with today selected, its entries, day stats and week totals', async () => {
    await renderWeek();
    expect(screen.getByText('Nov 16 – Nov 22')).toBeOnTheScreen();
    expect(screen.getByText('This week')).toBeOnTheScreen();
    expect(await screen.findByText('Squat')).toBeOnTheScreen();
    expect(screen.getByText('Pull-ups')).toBeOnTheScreen();
    expect(screen.getByText('4 × 8 · 65 kg')).toBeOnTheScreen();
    expect(screen.getByText('3 × 6 · bodyweight')).toBeOnTheScreen();
    expect(screen.getByText('2 exercises · 7 sets · 50 reps')).toBeOnTheScreen();
    expect(screen.queryByText('Bench Press')).not.toBeOnTheScreen(); // Monday's entry

    expect(screen.getByText('WEEK TOTALS')).toBeOnTheScreen();
    expect(screen.getByLabelText('4 exercises')).toBeOnTheScreen();
    expect(screen.getByLabelText('13 sets')).toBeOnTheScreen();
    expect(screen.getByLabelText('134 reps')).toBeOnTheScreen();
    expect(screen.getByLabelText('3,355 kg volume')).toBeOnTheScreen();
  });

  it('marks days that have entries and highlights the selected day', async () => {
    await renderWeek();
    expect(screen.getByRole('button', { name: 'Monday, Nov 16, has entries' })).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Tuesday, Nov 17, today, has entries' }),
    ).toBeSelected();
    expect(screen.getByRole('button', { name: 'Wednesday, Nov 18' })).not.toBeSelected();
  });

  it('shows another day of the week when it is tapped', async () => {
    await renderWeek();
    await press(/^Monday, Nov 16/);
    expect(await screen.findByText('Monday, Nov 16')).toBeOnTheScreen();
    expect(screen.getByText('Bench Press')).toBeOnTheScreen();
    expect(screen.getByText('Push-ups')).toBeOnTheScreen();
    expect(screen.queryByText('Squat')).not.toBeOnTheScreen();
    expect(screen.getByText('2 exercises · 6 sets · 84 reps')).toBeOnTheScreen();
  });

  it('distinguishes a past rest day from a day that has not happened yet', async () => {
    await renderWeek([]);
    await press(/^Monday, Nov 16/);
    expect(await screen.findByText('Rest day')).toBeOnTheScreen();
    expect(screen.getByText('Rest days are part of the plan.')).toBeOnTheScreen();
    await press(/^Thursday, Nov 19/);
    expect(await screen.findByText('Nothing logged yet')).toBeOnTheScreen();
  });

  it('navigates to the next and previous week keeping the weekday, and jumps back', async () => {
    await renderWeek();
    await press('Next week');
    expect(await screen.findByText('Nov 23 – Nov 29')).toBeOnTheScreen();
    expect(screen.getByText('Next week')).toBeOnTheScreen();
    expect(screen.getByText('Tuesday, Nov 24')).toBeOnTheScreen();
    expect(screen.getByText('Nothing logged yet')).toBeOnTheScreen();
    expect(screen.getByLabelText('0 exercises')).toBeOnTheScreen();

    await press('Previous week');
    await press('Previous week');
    expect(await screen.findByText('Nov 9 – Nov 15')).toBeOnTheScreen();
    expect(screen.getByText('Last week')).toBeOnTheScreen();
    expect(screen.getByText('Tuesday, Nov 10')).toBeOnTheScreen();
    expect(await screen.findByText('Old')).toBeOnTheScreen();
    expect(screen.getByLabelText('1 exercise')).toBeOnTheScreen();

    await press('Back to this week');
    expect(await screen.findByText('Nov 16 – Nov 22')).toBeOnTheScreen();
    expect(screen.getByText('Tuesday, Nov 17 · Today')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Back to this week' })).not.toBeOnTheScreen();
  });

  it('opens an entry for editing when its row is tapped', async () => {
    const { repo } = await renderWeek();
    const squat = (await repo.getAll()).find((x) => x.exerciseName === 'Squat');
    await fireEvent.press(await screen.findByRole('button', { name: /^Squat, 4 × 8 · 65 kg/ }));
    expect(router.push).toHaveBeenCalledWith(`/log?id=${squat?.id}`);
  });

  it('offers to log on the selected day (backfilling or planning)', async () => {
    await renderWeek([]);
    await press(/^Wednesday, Nov 18/);
    await fireEvent.press(await screen.findByRole('button', { name: 'Log an exercise' }));
    expect(router.push).toHaveBeenCalledWith('/log?date=2026-11-18');
  });

  it('shows an entry added elsewhere without a manual refresh', async () => {
    const { repo } = await renderWeek([]);
    await repo.add(e('Deadlift', '2026-11-17', 1, 5, 100));
    await waitFor(() => expect(screen.getByText('Deadlift')).toBeOnTheScreen());
    expect(screen.getByLabelText('1 exercise')).toBeOnTheScreen();
  });
});
