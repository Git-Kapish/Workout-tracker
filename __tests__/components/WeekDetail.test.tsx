import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useState, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WeekDetail } from '@/components/WeekDetail';
import { WeekStripPage } from '@/components/WeekStripPage';
import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { RepositoryProvider } from '@/hooks/useRepository';
import type { NewEntry } from '@/lib/types';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({ useFocusEffect: () => undefined }));

const e = (
  exerciseName: string,
  date: string,
  sets: number,
  reps: number,
  kg: number | null,
): NewEntry => ({ exerciseName, date, sets, reps, weightKg: kg });

// PRD §7.5, as drawn in docs/design/screens/04-week.png (today is Tuesday Nov 17).
const FIXTURE: NewEntry[] = [
  e('Bench Press', '2026-11-16', 3, 10, 42.5),
  e('Push-ups', '2026-11-16', 3, 18, null),
  e('Squat', '2026-11-17', 4, 8, 65),
  e('Pull-ups', '2026-11-17', 3, 6, null),
  e('Old', '2026-11-10', 1, 5, 20), // the week before, a Tuesday
];

interface HarnessProps {
  weekStartDate?: string;
  initialWeekday?: number;
  onOpenEntry?: (id: number) => void;
  onLogOnDay?: (date: string) => void;
}

/** The strip and the detail share the selected weekday, as on the Week screen. */
function Harness({
  weekStartDate = '2026-11-16',
  initialWeekday = 1,
  onOpenEntry = () => undefined,
  onLogOnDay = () => undefined,
}: HarnessProps) {
  const [weekday, setWeekday] = useState(initialWeekday);
  return (
    <>
      <WeekStripPage
        weekStartDate={weekStartDate}
        weekday={weekday}
        today="2026-11-17"
        width={390}
        onSelectWeekday={setWeekday}
      />
      <WeekDetail
        weekStartDate={weekStartDate}
        weekday={weekday}
        today="2026-11-17"
        bottomInset={90}
        onOpenEntry={onOpenEntry}
        onLogOnDay={onLogOnDay}
      />
    </>
  );
}

async function renderPage(seed: NewEntry[] = FIXTURE, props: HarnessProps = {}) {
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
  await render(<Harness {...props} />, { wrapper: Providers });
  return { repo };
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));

describe('Week day row and detail (docs/design/screens/04-week.png)', () => {
  it('shows the selected day, its entries, the day stats and the week totals', async () => {
    await renderPage();
    expect(await screen.findByText('Tuesday, Nov 17 · Today')).toBeOnTheScreen();
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

  it('marks days with entries and highlights the selected day', async () => {
    await renderPage();
    expect(
      await screen.findByRole('button', { name: 'Monday, Nov 16, has entries' }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Tuesday, Nov 17, today, has entries' }),
    ).toBeSelected();
    expect(screen.getByRole('button', { name: 'Wednesday, Nov 18' })).not.toBeSelected();
  });

  it('shows another day of the week when it is tapped in the row', async () => {
    await renderPage();
    await press(/^Monday, Nov 16/);
    expect(await screen.findByText('Monday, Nov 16')).toBeOnTheScreen();
    expect(screen.getByText('Bench Press')).toBeOnTheScreen();
    expect(screen.getByText('Push-ups')).toBeOnTheScreen();
    expect(screen.queryByText('Squat')).not.toBeOnTheScreen();
    expect(screen.getByText('2 exercises · 6 sets · 84 reps')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Monday, Nov 16/ })).toBeSelected();
  });

  it('distinguishes a past rest day from a day that has not happened yet', async () => {
    await renderPage([]);
    await press(/^Monday, Nov 16/);
    expect(await screen.findByText('Rest day')).toBeOnTheScreen();
    expect(screen.getByText('Rest days are part of the plan.')).toBeOnTheScreen();
    await press(/^Thursday, Nov 19/);
    expect(await screen.findByText('Nothing logged yet')).toBeOnTheScreen();
  });

  it("shows a different week's own entries and totals (what the row has swiped to)", async () => {
    await renderPage(FIXTURE, { weekStartDate: '2026-11-09' });
    expect(await screen.findByText('Tuesday, Nov 10')).toBeOnTheScreen();
    expect(await screen.findByText('Old')).toBeOnTheScreen();
    expect(screen.getByLabelText('1 exercise')).toBeOnTheScreen();
    expect(screen.queryByText('Squat')).not.toBeOnTheScreen();
  });

  it('shows an empty future week as nothing logged, with zero totals', async () => {
    await renderPage(FIXTURE, { weekStartDate: '2026-11-23' });
    expect(await screen.findByText('Tuesday, Nov 24')).toBeOnTheScreen();
    expect(await screen.findByText('Nothing logged yet')).toBeOnTheScreen();
    expect(screen.getByLabelText('0 exercises')).toBeOnTheScreen();
  });

  it('reports the tapped entry so it can be edited', async () => {
    const onOpenEntry = jest.fn();
    const { repo } = await renderPage(FIXTURE, { onOpenEntry });
    const squat = (await repo.getAll()).find((x) => x.exerciseName === 'Squat');
    await fireEvent.press(await screen.findByRole('button', { name: /^Squat, 4 × 8 · 65 kg/ }));
    expect(onOpenEntry).toHaveBeenCalledWith(squat?.id);
  });

  it('offers to log on the selected day (backfilling or planning)', async () => {
    const onLogOnDay = jest.fn();
    await renderPage([], { onLogOnDay });
    await press(/^Wednesday, Nov 18/);
    await fireEvent.press(await screen.findByRole('button', { name: 'Log an exercise' }));
    expect(onLogOnDay).toHaveBeenCalledWith('2026-11-18');
  });

  it('shows an entry added elsewhere without a manual refresh', async () => {
    const { repo } = await renderPage([]);
    await screen.findByText('Tuesday, Nov 17 · Today');
    await repo.add(e('Deadlift', '2026-11-17', 1, 5, 100));
    await waitFor(() => expect(screen.getByText('Deadlift')).toBeOnTheScreen());
    expect(screen.getByLabelText('1 exercise')).toBeOnTheScreen();
  });
});
