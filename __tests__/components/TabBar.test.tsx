import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';

import { activeTabName, TabBar } from '@/components/TabBar';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

type Props = ComponentProps<typeof TabBar>;

const ROUTES = [
  { key: 'index-1', name: 'index' },
  { key: 'week-1', name: 'week' },
  { key: 'detail-1', name: 'exercise/[name]' }, // hidden route, deliberately mid-list
  { key: 'progress-1', name: 'progress' },
  { key: 'exercises-1', name: 'exercises' },
];
const TITLES: Record<string, string> = {
  index: 'Today',
  week: 'Week',
  progress: 'Progress',
  exercises: 'Exercises',
  'exercise/[name]': 'Exercise',
};

async function renderBar(focusedName: string) {
  const emit = jest.fn(() => ({ defaultPrevented: false }));
  const navigateToTab = jest.fn();
  const props = {
    state: { index: ROUTES.findIndex((r) => r.name === focusedName), routes: ROUTES },
    descriptors: Object.fromEntries(
      ROUTES.map((r) => [r.key, { options: { title: TITLES[r.name] } }]),
    ),
    emitter: { emit },
    navigateToTab,
    insets: { top: 47, bottom: 34, left: 0, right: 0 },
  } as unknown as Props;
  await render(<TabBar {...props} />);
  return { navigateToTab, emit };
}

const tab = (name: string) => screen.getByRole('tab', { name });

beforeEach(() => jest.clearAllMocks());

describe('TabBar', () => {
  it('shows the four tabs and the centre button, but no item for the hidden detail route', async () => {
    await renderBar('index');
    expect(screen.getAllByRole('tab').map((t) => t.props.accessibilityLabel)).toEqual([
      'Today',
      'Week',
      'Progress',
      'Exercises',
    ]);
    expect(screen.queryByRole('tab', { name: 'Exercise' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Log exercise' })).toBeOnTheScreen();
  });

  it('highlights the focused tab', async () => {
    await renderBar('week');
    expect(tab('Week')).toBeSelected();
    expect(tab('Today')).not.toBeSelected();
  });

  it('keeps "Exercises" highlighted on the exercise detail screen (as in the design)', async () => {
    await renderBar('exercise/[name]');
    expect(tab('Exercises')).toBeSelected();
    expect(tab('Today')).not.toBeSelected();
  });

  it('does not navigate when the already-focused tab is pressed', async () => {
    const { navigateToTab } = await renderBar('week');
    await fireEvent.press(tab('Week'));
    expect(navigateToTab).not.toHaveBeenCalled();
  });

  it('navigates when another tab is pressed', async () => {
    const { navigateToTab } = await renderBar('week');
    await fireEvent.press(tab('Progress'));
    expect(navigateToTab).toHaveBeenCalledWith('progress-1');
  });

  it('returns to the list when the highlighted Exercises tab is pressed on the detail screen', async () => {
    const { navigateToTab } = await renderBar('exercise/[name]');
    await fireEvent.press(tab('Exercises'));
    expect(navigateToTab).toHaveBeenCalledWith('exercises-1');
  });

  it('opens the log sheet from the centre button', async () => {
    await renderBar('index');
    await fireEvent.press(screen.getByRole('button', { name: 'Log exercise' }));
    expect(router.push).toHaveBeenCalledWith('/log');
  });
});

describe('activeTabName', () => {
  it('maps hidden routes to their parent tab and leaves others alone', () => {
    expect(activeTabName('exercise/[name]')).toBe('exercises');
    expect(activeTabName('week')).toBe('week');
  });
});
