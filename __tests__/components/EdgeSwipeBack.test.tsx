import { act, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { EdgeSwipeBack } from '@/components/EdgeSwipeBack';

jest.mock('expo-router', () => ({
  router: { canGoBack: jest.fn(), back: jest.fn() },
}));

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
          startPageY: 400,
          startTimeStamp: 0,
          currentPageX: x,
          currentPageY: 400,
          currentTimeStamp: t,
          previousPageX: startX,
          previousPageY: 400,
          previousTimeStamp: 0,
        },
      ],
    },
  };
}

const strip = () => screen.getByTestId('edge-swipe-back', { includeHiddenElements: true });
const call = async (handler: string, ...args: unknown[]) => {
  const fn = strip().props[handler] as (...a: unknown[]) => unknown;
  let result: unknown;
  await act(async () => {
    result = fn(...args);
  });
  return result;
};

/** A swipe from the very edge: grant, move, release. */
async function swipe(to: number, ms: number) {
  await call('onResponderGrant', finger(4, 4, 0));
  await call('onResponderMove', finger(4, to, ms));
  await call('onResponderRelease', finger(4, to, ms + 1));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(router.canGoBack).mockReturnValue(true);
});

describe('EdgeSwipeBack', () => {
  it('goes back after a long swipe from the left edge', async () => {
    await render(<EdgeSwipeBack />);
    await swipe(180, 600);
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('goes back after a short fast flick', async () => {
    await render(<EdgeSwipeBack />);
    await swipe(54, 40); // 50 points in 40 ms
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('does not go back for a short, slow drag (the user changed their mind)', async () => {
    await render(<EdgeSwipeBack />);
    await swipe(44, 900); // 40 points in nearly a second
    expect(router.back).not.toHaveBeenCalled();
  });

  it('does not go back when the gesture is cancelled by the system', async () => {
    await render(<EdgeSwipeBack />);
    await call('onResponderGrant', finger(4, 4, 0));
    await call('onResponderMove', finger(4, 180, 600));
    await call('onResponderTerminate', finger(4, 180, 610));
    expect(router.back).not.toHaveBeenCalled();
  });

  it('only takes the touch when there is somewhere to go back to', async () => {
    await render(<EdgeSwipeBack />);
    expect(await call('onStartShouldSetResponder')).toBe(true);
    jest.mocked(router.canGoBack).mockReturnValue(false);
    expect(await call('onStartShouldSetResponder')).toBe(false);
  });

  it('is only a narrow strip along the left edge, hidden from screen readers', async () => {
    await render(<EdgeSwipeBack />);
    const style = Object.assign({}, ...[strip().props.style].flat());
    expect(style.left).toBe(0);
    expect(style.width).toBeLessThanOrEqual(24);
    expect(strip().props.importantForAccessibility).toBe('no-hide-descendants');
  });
});
