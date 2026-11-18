import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, StyleSheet, Text } from 'react-native';

import { Enter } from '@/components/Enter';
import { PressableScale } from '@/components/PressableScale';

beforeEach(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
});
afterEach(() => jest.restoreAllMocks());

describe('PressableScale', () => {
  it('still presses, and passes press-in and press-out through', async () => {
    const onPress = jest.fn();
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    await render(
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Go"
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Text>Go</Text>
      </PressableScale>,
    );
    const button = screen.getByRole('button', { name: 'Go' });
    await fireEvent(button, 'pressIn');
    await fireEvent(button, 'pressOut');
    await fireEvent.press(button);
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is not pressable when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <PressableScale accessibilityRole="button" accessibilityLabel="Go" disabled onPress={onPress}>
        <Text>Go</Text>
      </PressableScale>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Go' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('keeps the caller layout and adds only a transform (no layout property animates)', async () => {
    await render(
      <PressableScale accessibilityRole="button" accessibilityLabel="Go" style={{ width: 44 }}>
        <Text>Go</Text>
      </PressableScale>,
    );
    const style = StyleSheet.flatten(screen.getByRole('button', { name: 'Go' }).props.style);
    expect(style.width).toBe(44);
    expect(Object.keys(style).sort()).toEqual(['transform', 'width']);
  });
});

describe('Enter', () => {
  it('always renders its content', async () => {
    await render(
      <Enter index={0}>
        <Text>row</Text>
      </Enter>,
    );
    expect(screen.getByText('row')).toBeOnTheScreen();
  });

  it('animates only opacity and transform, and keeps the caller style', async () => {
    await render(
      <Enter index={2} style={{ margin: 1 }}>
        <Text>row</Text>
      </Enter>,
    );
    const style = StyleSheet.flatten(screen.getByText('row').parent?.props.style);
    expect(style.margin).toBe(1);
    expect(Object.keys(style).sort()).toEqual(['margin', 'opacity', 'transform']);
  });

  it('shows rows past the first eight at once, so scrolling a long list never staggers', async () => {
    await render(
      <Enter index={20}>
        <Text>late</Text>
      </Enter>,
    );
    const style = StyleSheet.flatten(screen.getByText('late').parent?.props.style);
    // A plain finished value rather than an animation that still has to run.
    expect(JSON.stringify(style.opacity)).toContain('1');
  });

  it('does not break when Reduce Motion is on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await render(
      <Enter index={0}>
        <Text>row</Text>
      </Enter>,
    );
    await act(async () => undefined);
    expect(screen.getByText('row')).toBeOnTheScreen();
  });
});
