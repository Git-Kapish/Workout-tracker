import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ProgressScreen from '../../app/(tabs)/progress';
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
  useToday: () => '2026-11-17', // a Tuesday; this week is Mon Nov 16 - Sun Nov 22
  useNow: () => new Date(2026, 10, 17, 18),
}));

const e = (
  exerciseName: string,
  date: string,
  sets: number,
  reps: number,
  kg: number | null,
): NewEntry => ({ exerciseName, date, sets, reps, weightKg: kg });

// PRD §7.5, as drawn in docs/design/screens/05-progress.png.
const LAST_WEEK = [
  e('Bench Press', '2026-11-09', 3, 10, 40),
  e('Squat', '2026-11-10', 4, 8, 60),
  e('Push-ups', '2026-11-11', 3, 15, null),
];
const THIS_WEEK = [
  e('Bench Press', '2026-11-16', 3, 10, 42.5),
  e('Squat', '2026-11-17', 4, 8, 65),
  e('Push-ups', '2026-11-18', 3, 18, null),
  e('Pull-ups', '2026-11-19', 3, 6, null),
];
// Earlier weeks of the chart: reps 88, 96, (none), 101, 94, 99 on weeks 9/28 ... 11/2.
const EARLIER = [
  e('X', '2026-09-28', 1, 88, null),
  e('X', '2026-10-05', 1, 96, null),
  e('X', '2026-10-19', 1, 101, null),
  e('X', '2026-10-26', 1, 94, null),
  e('X', '2026-11-02', 1, 99, null),
];
const DESIGN_DATA = [...EARLIER, ...LAST_WEEK, ...THIS_WEEK];

async function renderProgress(seed: NewEntry[] = DESIGN_DATA) {
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
  await render(<ProgressScreen />, { wrapper: Providers });
  await screen.findByText('progress.');
  return { repo };
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));

beforeEach(() => jest.clearAllMocks());

describe('Progress screen: the PRD worked example (docs/design/screens/05-progress.png)', () => {
  it('shows the week-vs-week caption and the overall status from total reps', async () => {
    await renderProgress();
    expect(screen.getByText('Nov 16 – Nov 22 vs Nov 9 – Nov 15')).toBeOnTheScreen();
    expect(await screen.findByText('Up 25%')).toBeOnTheScreen();
    expect(screen.getByText('134 reps vs 107 last week')).toBeOnTheScreen();
    expect(screen.getByText('Overall · total reps')).toBeOnTheScreen();
    expect(screen.getByText('Up')).toBeOnTheScreen(); // status pill
  });

  it('shows all four stat cards with the hand-calculated values, changes and trends', async () => {
    await renderProgress();
    expect(await screen.findByLabelText('Exercises: 4, last week 3')).toBeOnTheScreen();
    expect(screen.getByLabelText('Sets: 13, last week 10')).toBeOnTheScreen();
    expect(screen.getByLabelText('Reps: 134, last week 107')).toBeOnTheScreen();
    expect(screen.getByLabelText('Volume (kg): 3,355, last 3,120')).toBeOnTheScreen();
    // +33 / +30 / +25 / +8 percent, every one an Up badge (arrow + number, not just colour)
    expect(screen.getByLabelText('up, +33%')).toBeOnTheScreen();
    expect(screen.getByLabelText('up, +30%')).toBeOnTheScreen();
    expect(screen.getByLabelText('up, +25%')).toBeOnTheScreen();
    expect(screen.getByLabelText('up, +8%')).toBeOnTheScreen();
  });

  it('draws the last 8 weeks of reps with the current week highlighted', async () => {
    await renderProgress();
    await screen.findByText('Up 25%');
    for (const label of ['9/28', '10/5', '10/12', '10/19', '10/26', '11/2', '11/9', '11/16']) {
      expect(screen.getByText(label)).toBeOnTheScreen();
    }
    expect(screen.getByLabelText('Week of 9/28: 88 reps')).toBeOnTheScreen();
    expect(screen.getByLabelText('Week of 10/12: 0 reps')).toBeOnTheScreen(); // the empty week is kept
    expect(screen.getByLabelText('Week of 11/9: 107 reps')).toBeOnTheScreen();
    expect(screen.getByLabelText('Week of 11/16: 134 reps, selected week')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Show reps' })).toBeSelected();
  });

  it('switches the chart to volume with compact labels', async () => {
    await renderProgress();
    await screen.findByText('Up 25%');
    await press('Show volume');
    expect(screen.getByRole('button', { name: 'Show volume' })).toBeSelected();
    expect(
      screen.getByLabelText('Week of 11/16: 3,355 kg volume, selected week'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Week of 11/9: 3,120 kg volume')).toBeOnTheScreen();
    expect(screen.getByText('3.4k')).toBeOnTheScreen();
    expect(screen.getByText('3.1k')).toBeOnTheScreen();
    await press('Show reps');
    expect(screen.getByLabelText('Week of 11/16: 134 reps, selected week')).toBeOnTheScreen();
  });
});

describe('Progress screen: other weeks and edge states', () => {
  it('compares any week with the week before it, and jumps back to this week', async () => {
    await renderProgress();
    await screen.findByText('Up 25%');
    expect(screen.queryByRole('button', { name: 'Back to this week' })).not.toBeOnTheScreen();

    await press('Previous week');
    expect(await screen.findByText('Nov 9 – Nov 15 vs Nov 2 – Nov 8')).toBeOnTheScreen();
    // 107 reps vs the 99 of the week before: (107 - 99) / 99 = 8.08 -> 8
    expect(await screen.findByText('Up 8%')).toBeOnTheScreen();
    expect(screen.getByText('107 reps vs 99 prior week')).toBeOnTheScreen();
    // the chart now ends on the selected week
    expect(screen.getByLabelText('Week of 11/9: 107 reps, selected week')).toBeOnTheScreen();
    expect(screen.queryByText('11/16')).not.toBeOnTheScreen();

    await press('Back to this week');
    expect(await screen.findByText('Up 25%')).toBeOnTheScreen();
  });

  it('shows "No baseline" everywhere, and never NaN or Infinity, when last week is empty', async () => {
    await renderProgress(THIS_WEEK);
    expect(await screen.findByText('134 reps · nothing to compare')).toBeOnTheScreen();
    expect(screen.getAllByText('No baseline')).toHaveLength(6); // headline, status pill, 4 cards
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Exercises: 4, last week 0')).toBeOnTheScreen();
  });

  it('shows a 100% drop when last week had data and this week has none', async () => {
    await renderProgress(LAST_WEEK);
    expect(await screen.findByText('Down 100%')).toBeOnTheScreen();
    expect(screen.getByText('0 reps vs 107 last week')).toBeOnTheScreen();
    expect(screen.getAllByLabelText('down, -100%')).toHaveLength(4); // all four stat cards
    expect(screen.getByText('Down')).toBeOnTheScreen(); // status pill
  });

  it('shows "Same" when the week matches the previous one exactly', async () => {
    await renderProgress([e('A', '2026-11-10', 3, 10, 50), e('A', '2026-11-17', 3, 10, 50)]);
    expect(await screen.findByText('30 reps vs 30 last week')).toBeOnTheScreen();
    expect(screen.getAllByText('Same')).toHaveLength(2); // headline and status pill
    expect(screen.getAllByLabelText('same, 0%')).toHaveLength(4); // every stat card
  });

  it('says "No data yet" with a way to log when there is nothing in the shown weeks', async () => {
    await renderProgress([]);
    expect(await screen.findByText('No data yet')).toBeOnTheScreen();
    expect(screen.queryByText('Overall · total reps')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Log an exercise' }));
    expect(router.push).toHaveBeenCalledWith('/log');
  });

  it('refreshes when an entry is added', async () => {
    const { repo } = await renderProgress(LAST_WEEK);
    await screen.findByText('Down 100%');
    await repo.add(e('Deadlift', '2026-11-17', 3, 36, 100)); // 108 reps beats 107
    await waitFor(() => expect(screen.getByText('Up 1%')).toBeOnTheScreen());
  });
});
