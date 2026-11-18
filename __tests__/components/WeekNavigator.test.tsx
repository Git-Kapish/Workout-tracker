import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WeekNavigator } from '@/components/WeekNavigator';

const baseProps = {
  label: 'progress.',
  caption: 'Nov 16 – Nov 22 vs Nov 9 – Nov 15',
  onPrevious: () => undefined,
  onNext: () => undefined,
  onJumpToToday: () => undefined,
  stackJump: true,
};

async function renderNavigator(isCurrentWeek: boolean) {
  const ui = (current: boolean) => (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <WeekNavigator {...baseProps} isCurrentWeek={current} />
    </SafeAreaProvider>
  );
  const view = await render(ui(isCurrentWeek));
  return { rerender: (current: boolean) => view.rerender(ui(current)) };
}

describe('WeekNavigator keeps its buttons in one place (Progress and Week)', () => {
  it('top-aligns the buttons instead of centring them on the text block', async () => {
    await renderNavigator(true);
    const row = screen.getByTestId('week-navigator-row');
    expect(StyleSheet.flatten(row.props.style).alignItems).toBe('flex-start');
  });

  it('reserves the line for the "This week" link, so showing it moves nothing', async () => {
    const { rerender } = await renderNavigator(true);
    expect(screen.queryByRole('button', { name: 'Back to this week' })).toBeNull();
    const reserved = StyleSheet.flatten(screen.getByTestId('jump-slot').props.style).minHeight;
    expect(reserved).toBeGreaterThan(0);

    await rerender(false);
    expect(screen.getByRole('button', { name: 'Back to this week' })).toBeOnTheScreen();
    expect(StyleSheet.flatten(screen.getByTestId('jump-slot').props.style).minHeight).toBe(
      reserved,
    );
  });

  it('keeps the arrows working', async () => {
    await renderNavigator(false);
    expect(screen.getByRole('button', { name: 'Previous week' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Next week' })).toBeOnTheScreen();
  });
});
