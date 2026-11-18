import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
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

// Layout as the device reports it: the four tabs inside the capsule, with the + gap in the middle.
const LAYOUT: Record<string, number> = { Today: 8, Week: 88, Progress: 250, Exercises: 330 };

async function measure() {
  for (const [name, x] of Object.entries(LAYOUT)) {
    await fireEvent(tab(name), 'layout', {
      nativeEvent: { layout: { x, y: 6, width: 80, height: 52 } },
    });
  }
}

/** Drives a responder callback directly: RNTL would refuse these events, because a pan only claims the touch once it moves. */
async function gesture(
  element: { props: Record<string, unknown> },
  handler: string,
  event: unknown,
) {
  const fn = element.props[handler] as (e: unknown) => void;
  await act(async () => fn(event));
}

/** A one-finger touch history, the shape React Native's PanResponder reads. */
function finger(startX: number, x: number, t: number) {
  return {
    touchHistory: {
      indexOfSingleActiveTouch: 0,
      numberActiveTouches: 1,
      mostRecentTimeStamp: t,
      touchBank: [
        {
          touchActive: true,
          startPageX: startX,
          startPageY: 800,
          startTimeStamp: 0,
          currentPageX: x,
          currentPageY: 800,
          currentTimeStamp: t,
          previousPageX: startX,
          previousPageY: 800,
          previousTimeStamp: 0,
        },
      ],
    },
  };
}

describe('TabBar highlight and scrubbing', () => {
  it('draws the sliding highlight once the tabs are measured', async () => {
    await renderBar('index');
    expect(screen.queryByTestId('tab-highlight')).toBeNull();
    await measure();
    const style = StyleSheet.flatten(screen.getByTestId('tab-highlight').props.style);
    expect(style.width).toBe(80);
    expect(style.height).toBe(52);
  });

  it('opens the tab under the finger when it is slid along the bar and released', async () => {
    const { navigateToTab } = await renderBar('index');
    await measure();
    const bar = screen.getByTestId('tab-bar');
    // The capsule starts 16pt from the screen edge, so Progress (centre 290) is at page x 306.
    await gesture(bar, 'onResponderGrant', finger(60, 60, 0));
    await gesture(bar, 'onResponderMove', finger(60, 150, 40));
    await gesture(bar, 'onResponderMove', finger(60, 306, 80));
    // The tint follows the finger before the tab has opened.
    expect(StyleSheet.flatten(screen.getByText('Progress').props.style).fontWeight).toBe('600');
    expect(navigateToTab).not.toHaveBeenCalled();
    await gesture(bar, 'onResponderRelease', finger(60, 306, 90));
    expect(navigateToTab).toHaveBeenCalledTimes(1);
    expect(navigateToTab).toHaveBeenCalledWith('progress-1');
  });

  it('does not navigate when the slide ends on the tab that is already open', async () => {
    const { navigateToTab } = await renderBar('week');
    await measure();
    const bar = screen.getByTestId('tab-bar');
    await gesture(bar, 'onResponderGrant', finger(60, 60, 0));
    await gesture(bar, 'onResponderMove', finger(60, 144, 40));
    await gesture(bar, 'onResponderRelease', finger(60, 144, 60));
    expect(navigateToTab).not.toHaveBeenCalled();
  });

  it('goes back to the open tab if the gesture is cancelled', async () => {
    const { navigateToTab } = await renderBar('index');
    await measure();
    const bar = screen.getByTestId('tab-bar');
    await gesture(bar, 'onResponderGrant', finger(60, 60, 0));
    await gesture(bar, 'onResponderMove', finger(60, 306, 40));
    await gesture(bar, 'onResponderTerminate', finger(60, 306, 50));
    expect(navigateToTab).not.toHaveBeenCalled();
    expect(StyleSheet.flatten(screen.getByText('Today').props.style).fontWeight).toBe('600');
  });

  it('still opens a tab with a plain tap', async () => {
    const { navigateToTab } = await renderBar('index');
    await measure();
    await fireEvent.press(tab('Exercises'));
    expect(navigateToTab).toHaveBeenCalledWith('exercises-1');
  });
});
