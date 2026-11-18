import { render, screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LogScreen from '../../app/log';
import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { RepositoryProvider } from '@/hooks/useRepository';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useFocusEffect: () => undefined,
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/hooks/useNow', () => ({
  useToday: () => '2026-11-18',
  useNow: () => new Date(2026, 10, 18, 10),
}));

async function renderLog(params: Record<string, string>) {
  jest.mocked(useLocalSearchParams).mockReturnValue(params as never);
  const db = createTestExecutor();
  await runMigrations(db);
  const repo = createEntriesRepository(db);
  await repo.add({ exerciseName: 'Bench', sets: 3, reps: 10, weightKg: 20.5, date: '2026-11-18' });
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <RepositoryProvider repository={repo}>
        <LogScreen />
      </RepositoryProvider>
    </SafeAreaProvider>,
  );
}

const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

// Regression: on the Edit sheet (taller, it has a Delete button) the sheet used to grow up
// over the weekday / date / count shown behind it.
describe.each([
  ['Add', {}],
  ['Edit', { id: '1' }],
])('log sheet (%s mode)', (_name, params) => {
  it('keeps the date header visible: the sheet area starts below it and caps the sheet to the rest', async () => {
    await renderLog(params);
    await screen.findByText('WEDNESDAY');
    const header = style('log-header');
    const zone = style('log-sheet-zone');
    const sheet = style('log-sheet');

    expect(header.position).toBe('absolute');
    expect(header.top).toBe(0);
    expect(zone.paddingTop).toBe(header.height); // the sheet can never enter the header zone
    expect(sheet.maxHeight).toBe('100%'); // ...and is capped to the area below it
  });

  it('shows the weekday, date and count above the sheet', async () => {
    await renderLog(params);
    expect(await screen.findByText('WEDNESDAY')).toBeOnTheScreen();
    expect(screen.getByText('Nov 18')).toBeOnTheScreen();
    expect(await screen.findByText('1 exercise logged today')).toBeOnTheScreen();
  });
});
