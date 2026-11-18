import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { lightPalette } from '@/theme/colors';

import TodayScreen from '../../app/(tabs)/index';
import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { RepositoryProvider } from '@/hooks/useRepository';
import type { NewEntry } from '@/lib/types';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useFocusEffect: () => undefined,
}));
jest.mock('@/hooks/useNow', () => ({
  useToday: () => '2026-11-17',
  useNow: () => new Date(2026, 10, 17, 18), // Tuesday evening
}));
jest.mock('@/platform/exportCsv', () => ({ exportCsv: jest.fn() }));

const e = (
  exerciseName: string,
  date: string,
  sets: number,
  reps: number,
  kg: number | null,
): NewEntry => ({ exerciseName, date, sets, reps, weightKg: kg });

const FIXTURE: NewEntry[] = [
  e('Bench Press', '2026-11-16', 3, 10, 42.5),
  e('Squat', '2026-11-17', 4, 8, 65),
  e('Pull-ups', '2026-11-17', 3, 6, null),
  e('Deadlift', '2026-11-03', 1, 5, 100), // a different week, same month
];

async function renderToday(seed: NewEntry[] = FIXTURE) {
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
  await render(<TodayScreen />, { wrapper: Providers });
  return { repo };
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));

beforeEach(() => jest.clearAllMocks());

describe('Today: the week row now selects a day', () => {
  it('starts on today with its entries', async () => {
    await renderToday();
    expect(await screen.findByText('Squat')).toBeOnTheScreen();
    expect(screen.getByText('2 exercises logged so far')).toBeOnTheScreen();
    expect(screen.getByText("TODAY'S LOG")).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Tuesday, Nov 17, today/ })).toBeSelected();
  });

  it('previews another day when it is tapped: its entries, hero, header date and heading', async () => {
    await renderToday();
    await screen.findByText('Squat');
    await press(/^Monday, Nov 16/);

    expect(await screen.findByText('Bench Press')).toBeOnTheScreen();
    expect(screen.queryByText('Squat')).not.toBeOnTheScreen();
    expect(screen.getByText('1 exercise logged')).toBeOnTheScreen(); // no "so far" for another day
    expect(screen.getByText('Monday, Nov 16')).toBeOnTheScreen();
    expect(screen.getByText('NOV 16 LOG')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Open calendar, Nov 16$/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Monday, Nov 16/ })).toBeSelected();
  });

  it('says plainly when the previewed day has nothing logged', async () => {
    await renderToday();
    await screen.findByText('Squat');
    await press(/^Wednesday, Nov 18/);
    expect(await screen.findByText('Nothing logged')).toBeOnTheScreen();
    expect(screen.getByText('No exercises logged this day.')).toBeOnTheScreen();
  });

  it('adds to the previewed day, not to today', async () => {
    await renderToday();
    await screen.findByText('Squat');
    await press(/^Monday, Nov 16/);
    await fireEvent.press(await screen.findByRole('button', { name: 'Add exercise' }));
    expect(router.push).toHaveBeenCalledWith('/log?date=2026-11-16');
  });

  it('still adds to today when today is shown', async () => {
    await renderToday();
    await fireEvent.press(await screen.findByRole('button', { name: 'Add exercise' }));
    expect(router.push).toHaveBeenCalledWith('/log');
  });

  it('keeps the week summary for the current week whichever day is previewed', async () => {
    await renderToday();
    await screen.findByText('Squat');
    await press(/^Monday, Nov 16/);
    expect(await screen.findByText(/This week/)).toBeOnTheScreen();
  });
});

describe('Today: the date button opens a calendar', () => {
  it('opens a month calendar for the month of the selected day', async () => {
    await renderToday();
    await press(/^Open calendar/);
    expect(await screen.findByText('November 2026')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Close calendar$/ })).toBeOnTheScreen();
  });

  it('draws a green mark under each logged day, and none under the others', async () => {
    await renderToday();
    await press(/^Open calendar/);
    const calendar = await screen.findByText('November 2026');
    expect(calendar).toBeOnTheScreen();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Tuesday, Nov 3, logged' })).toBeOnTheScreen(),
    );
    expect(screen.getByRole('button', { name: 'Monday, Nov 16, logged' })).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Tuesday, Nov 17, today, logged' }),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Wednesday, Nov 4' })).toBeOnTheScreen(); // not logged
    expect(screen.queryByRole('button', { name: 'Wednesday, Nov 4, logged' })).toBeNull();
  });

  it('uses the theme green for logged marks and nothing for empty days', async () => {
    await renderToday();
    await press(/^Open calendar/);
    await screen.findByRole('button', { name: 'Monday, Nov 16, logged' });
    const logged = screen.getAllByTestId('logged-mark');
    expect(logged).toHaveLength(3); // Nov 3, 16 and 17
    for (const mark of logged) {
      expect(StyleSheet.flatten(mark.props.style).backgroundColor).toBe(lightPalette.trendUpFg);
    }
    expect(
      StyleSheet.flatten(screen.getAllByTestId('empty-mark')[0]?.props.style).backgroundColor,
    ).toBe('transparent');
  });

  it('moves between months', async () => {
    await renderToday();
    await press(/^Open calendar/);
    await screen.findByText('November 2026');
    await press('Next month');
    expect(await screen.findByText('December 2026')).toBeOnTheScreen();
    await press('Previous month');
    await press('Previous month');
    expect(await screen.findByText('October 2026')).toBeOnTheScreen();
  });

  it('jumps Today to the picked day and closes the calendar', async () => {
    await renderToday();
    await press(/^Open calendar/);
    await fireEvent.press(await screen.findByRole('button', { name: 'Tuesday, Nov 3, logged' }));
    await waitFor(() => expect(screen.queryByText('November 2026')).toBeNull());
    expect(await screen.findByText('Deadlift')).toBeOnTheScreen();
    expect(screen.getByText('Tuesday, Nov 3')).toBeOnTheScreen();
    // The strip now shows that day's week (Nov 2 - Nov 8)
    expect(screen.getByRole('button', { name: /^Tuesday, Nov 3/ })).toBeSelected();
    expect(screen.queryByRole('button', { name: /^Monday, Nov 16/ })).toBeNull();
  });

  it('"Go to today" returns to today', async () => {
    await renderToday();
    await press(/^Monday, Nov 16/);
    await press(/^Open calendar/);
    await fireEvent.press(await screen.findByRole('button', { name: 'Go to today' }));
    expect(await screen.findByText('Squat')).toBeOnTheScreen();
    expect(screen.getByText('2 exercises logged so far')).toBeOnTheScreen();
  });

  it('closes with the close button without changing the day', async () => {
    await renderToday();
    await press(/^Monday, Nov 16/);
    await press(/^Open calendar/);
    await fireEvent.press(await screen.findByRole('button', { name: 'Close calendar' }));
    await waitFor(() => expect(screen.queryByText('November 2026')).toBeNull());
    expect(screen.getByRole('button', { name: /^Monday, Nov 16/ })).toBeSelected();
  });
});
