import { render, screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ExerciseDetailRoute from '../../app/(tabs)/exercise/[name]';
import ExercisesScreen from '../../app/(tabs)/exercises';
import TodayScreen from '../../app/(tabs)/index';
import ProgressScreen from '../../app/(tabs)/progress';
import WeekScreen from '../../app/(tabs)/week';
import LogScreen from '../../app/log';
import WelcomeScreen from '../../app/welcome';
import { createEntriesRepository } from '@/db/entries';
import { runMigrations } from '@/db/migrations';
import { createSettingsRepository } from '@/db/settings';
import { RepositoryProvider } from '@/hooks/useRepository';
import { WelcomeProvider } from '@/hooks/useWelcome';
import { encodeExerciseSlug } from '@/lib/exerciseRoute';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useFocusEffect: () => undefined,
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/hooks/useNow', () => ({
  useToday: () => '2026-11-17',
  useNow: () => new Date(2026, 10, 17, 18),
}));
jest.mock('@/platform/exportCsv', () => ({ exportCsv: jest.fn() }));

/** Every text field on screen (TextInput has no implicit role, so find it by its value). */
const textInputs = () => screen.queryAllByDisplayValue(/^/);
const hasLabel = (input: { props: Record<string, unknown> }) =>
  String(input.props.accessibilityLabel ?? '').length > 0;

async function setup(ui: ReactNode, params: Record<string, string> = {}) {
  jest.mocked(useLocalSearchParams).mockReturnValue(params as never);
  const db = createTestExecutor();
  await runMigrations(db);
  const repo = createEntriesRepository(db);
  await repo.add({ exerciseName: 'Squat', sets: 4, reps: 8, weightKg: 65, date: '2026-11-17' });
  await repo.add({
    exerciseName: 'Pull-ups',
    sets: 3,
    reps: 6,
    weightKg: null,
    date: '2026-11-16',
  });
  await repo.add({ exerciseName: 'Squat', sets: 4, reps: 8, weightKg: 60, date: '2026-11-10' });
  const entry = (await repo.getAll())[0];
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <RepositoryProvider repository={repo}>
        <WelcomeProvider settings={createSettingsRepository(db)} initialSeen={false}>
          {ui}
        </WelcomeProvider>
      </RepositoryProvider>
    </SafeAreaProvider>,
  );
  return { entryId: entry?.id };
}

const SCREENS: [string, () => ReactNode, Record<string, string>][] = [
  ['Today', () => <TodayScreen />, {}],
  ['Week', () => <WeekScreen />, {}],
  ['Progress', () => <ProgressScreen />, {}],
  ['Exercises', () => <ExercisesScreen />, {}],
  ['Exercise detail', () => <ExerciseDetailRoute />, { name: encodeExerciseSlug('Squat') }],
  ['Log (add)', () => <LogScreen />, {}],
  ['Welcome', () => <WelcomeScreen />, {}],
];

describe('every interactive control has a spoken name', () => {
  it('finds the text fields it is checking (so the audit cannot pass by finding nothing)', async () => {
    await setup(<LogScreen />);
    await screen.findByText('Log exercise');
    expect(textInputs().length).toBeGreaterThanOrEqual(4); // name, sets, reps, weight
  });

  it.each(SCREENS)('%s', async (_name, ui, params) => {
    await setup(ui(), params);
    // let the async data arrive so the controls that depend on it are on screen too
    await screen.findAllByRole('button');
    await new Promise((resolve) => setTimeout(resolve, 100));

    for (const input of textInputs()) expect(hasLabel(input)).toBe(true);
    for (const role of ['button', 'tab'] as const) {
      for (const element of screen.queryAllByRole(role)) {
        expect(element).toHaveAccessibleName();
      }
    }
  });

  it('Log (edit)', async () => {
    const { entryId } = await setup(<LogScreen />, { id: '1' });
    expect(entryId).toBeDefined();
    await screen.findByText('Edit exercise');
    for (const element of screen.queryAllByRole('button')) {
      expect(element).toHaveAccessibleName();
    }
    expect(screen.getByRole('button', { name: 'Delete entry' })).toBeOnTheScreen();
  });
});
