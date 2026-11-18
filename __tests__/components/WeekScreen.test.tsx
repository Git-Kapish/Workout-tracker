import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { size } from '@/theme';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import WeekScreen from '../../app/(tabs)/week';
import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { RepositoryProvider } from '@/hooks/useRepository';
import { PAGER_CENTER, PAGER_COUNT } from '@/lib/weekPager';
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

const WIDTH = 390;

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
  // The pager waits for its measured size before drawing; supply one like the device does.
  await fireEvent(screen.getByTestId('week-pager-box'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: WIDTH, height: 700 } },
  });
  return { repo };
}

/** Scroll the pager as a finger would, to the given horizontal offset. */
const swipeTo = (offsetX: number) =>
  fireEvent(screen.getByTestId('week-pager'), 'scroll', {
    nativeEvent: {
      contentOffset: { x: offsetX, y: 0 },
      contentSize: { width: WIDTH * PAGER_COUNT, height: 700 },
      layoutMeasurement: { width: WIDTH, height: 700 },
    },
  });
const swipeToPage = (page: number) => swipeTo(page * WIDTH);

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));

beforeEach(() => jest.clearAllMocks());

describe('Week screen: swiping between weeks', () => {
  it('opens on the current week with the pager on the centre page', async () => {
    await renderWeek();
    expect(screen.getByText('Nov 16 – Nov 22')).toBeOnTheScreen();
    expect(screen.getByText('This week')).toBeOnTheScreen();
    expect(await screen.findByText('Tuesday, Nov 17 · Today')).toBeOnTheScreen();
    expect(await screen.findByText('Squat')).toBeOnTheScreen();
    expect(screen.getByTestId('week-pager').props.pagingEnabled).toBe(true);
    expect(screen.getByTestId('week-pager').props.horizontal).toBe(true);
    expect(screen.getByTestId('week-pager').props.initialScrollIndex).toBe(PAGER_CENTER);
  });

  it('draws nothing until the pager has been measured (it needs the page size)', async () => {
    const db = createTestExecutor();
    await runMigrations(db);
    await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        <RepositoryProvider repository={createEntriesRepository(db)}>
          <WeekScreen />
        </RepositoryProvider>
      </SafeAreaProvider>,
    );
    expect(screen.queryByTestId('week-pager')).not.toBeOnTheScreen();
    expect(screen.getByText('Nov 16 – Nov 22')).toBeOnTheScreen(); // the header is already there
  });

  it('follows a swipe to the next week and back, updating the header', async () => {
    await renderWeek();
    await swipeToPage(PAGER_CENTER + 1);
    expect(await screen.findByText('Nov 23 – Nov 29')).toBeOnTheScreen();
    expect(screen.getByText('Next week')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Back to this week' })).toBeOnTheScreen();

    await swipeToPage(PAGER_CENTER - 1);
    expect(await screen.findByText('Nov 9 – Nov 15')).toBeOnTheScreen();
    expect(screen.getByText('Last week')).toBeOnTheScreen();

    await swipeToPage(PAGER_CENTER);
    expect(await screen.findByText('Nov 16 – Nov 22')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Back to this week' })).not.toBeOnTheScreen();
  });

  it('scrolls only the row of days: the pager is as tall as that row, nothing else is in it', async () => {
    await renderWeek();
    const box = screen.getByTestId('week-pager-box');
    expect(StyleSheet.flatten(box.props.style).height).toBe(size.dayCellH);
    // The entries and totals are not inside the pager, so they cannot scroll sideways.
    expect(within(screen.getByTestId('week-pager')).queryByText('WEEK TOTALS')).toBeNull();
    expect(within(screen.getByTestId('week-pager')).queryByText('Squat')).toBeNull();
    expect(screen.getByText('WEEK TOTALS')).toBeOnTheScreen();
  });

  it('keeps the same weekday selected and moves the entries below to the new week', async () => {
    await renderWeek();
    expect(await screen.findByText('Squat')).toBeOnTheScreen();
    await swipeToPage(PAGER_CENTER + 1);
    expect(await screen.findByText('Tuesday, Nov 24')).toBeOnTheScreen();
    expect(screen.queryByText('Squat')).not.toBeOnTheScreen();
    await swipeToPage(PAGER_CENTER);
    expect(await screen.findByText('Squat')).toBeOnTheScreen();
  });

  it('changes week only once a swipe passes halfway to the next page', async () => {
    await renderWeek();
    await swipeTo(PAGER_CENTER * WIDTH + 100); // a quarter of the way
    expect(screen.getByText('Nov 16 – Nov 22')).toBeOnTheScreen();
    await swipeTo(PAGER_CENTER * WIDTH + 190); // just under halfway
    expect(screen.getByText('Nov 16 – Nov 22')).toBeOnTheScreen();
    await swipeTo(PAGER_CENTER * WIDTH + 200); // past halfway
    expect(await screen.findByText('Nov 23 – Nov 29')).toBeOnTheScreen();
    await swipeTo(PAGER_CENTER * WIDTH + 150); // dragging back under halfway
    expect(await screen.findByText('Nov 16 – Nov 22')).toBeOnTheScreen();
  });

  it('crosses a month and a year when swiping several weeks', async () => {
    await renderWeek();
    await swipeToPage(PAGER_CENTER + 7);
    expect(await screen.findByText('Jan 4 – Jan 10')).toBeOnTheScreen();
    await swipeToPage(PAGER_CENTER + 6);
    expect(await screen.findByText('Dec 28, 2026 – Jan 3, 2027')).toBeOnTheScreen();
    expect(screen.getByText('In 6 weeks')).toBeOnTheScreen();
  });

  it('stays inside the pager when rubber-banding past either end', async () => {
    await renderWeek();
    await swipeTo(-120); // pulled past the first week
    expect(await screen.findByText(/weeks ago/)).toBeOnTheScreen();
    await swipeTo(WIDTH * PAGER_COUNT + 400); // pulled past the last week
    expect(await screen.findByText(/In \d+ weeks/)).toBeOnTheScreen();
    expect(screen.queryByText(/NaN|undefined|Invalid/)).not.toBeOnTheScreen();
  });

  it('still works with the arrows, and "This week" jumps back', async () => {
    await renderWeek();
    await press('Next week');
    expect(await screen.findByText('Nov 23 – Nov 29')).toBeOnTheScreen();
    await press('Previous week');
    await press('Previous week');
    expect(await screen.findByText('Nov 9 – Nov 15')).toBeOnTheScreen();
    expect(screen.getByText('Last week')).toBeOnTheScreen();
    await press('Back to this week');
    expect(await screen.findByText('Nov 16 – Nov 22')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Back to this week' })).not.toBeOnTheScreen();
  });

  it('keeps arrow presses and swipes in step with each other', async () => {
    await renderWeek();
    await swipeToPage(PAGER_CENTER + 2);
    await press('Next week');
    expect(await screen.findByText('Dec 7 – Dec 13')).toBeOnTheScreen(); // +3 weeks
    await press('Previous week');
    expect(await screen.findByText('Nov 30 – Dec 6')).toBeOnTheScreen(); // +2 again
  });

  it('opens an entry for editing from the current week', async () => {
    const { repo } = await renderWeek();
    const squat = (await repo.getAll()).find((x) => x.exerciseName === 'Squat');
    await fireEvent.press(await screen.findByRole('button', { name: /^Squat, 4 × 8 · 65 kg/ }));
    expect(router.push).toHaveBeenCalledWith(`/log?id=${squat?.id}`);
  });
});
