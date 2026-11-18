import { fireEvent, render, screen } from '@testing-library/react-native';

import { DayStrip } from '@/components/DayStrip';
import { PillButton } from '@/components/PillButton';
import { RoundButton } from '@/components/RoundButton';
import { haptics } from '@/platform/haptics';

jest.mock('@/platform/haptics', () => ({
  haptics: { selection: jest.fn(), tap: jest.fn(), success: jest.fn(), warning: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

const DAYS = [
  '2026-11-16',
  '2026-11-17',
  '2026-11-18',
  '2026-11-19',
  '2026-11-20',
  '2026-11-21',
  '2026-11-22',
].map((date) => ({ date, hasEntries: false }));

describe('haptics on interactions', () => {
  it('ticks when a different day is picked, not when the selected day is tapped again', async () => {
    const onSelect = jest.fn();
    await render(
      <DayStrip days={DAYS} today="2026-11-17" selected="2026-11-17" onSelect={onSelect} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: /^Tuesday, Nov 17/ }));
    expect(haptics.selection).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: /^Friday, Nov 20/ }));
    expect(haptics.selection).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenLastCalledWith('2026-11-20');
  });

  it('taps on round and pill buttons, and still runs the action', async () => {
    const onRound = jest.fn();
    const onPill = jest.fn();
    await render(
      <>
        <RoundButton icon="close" label="Close" onPress={onRound} />
        <PillButton label="Save" onPress={onPill} />
      </>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(haptics.tap).toHaveBeenCalledTimes(2);
    expect(onRound).toHaveBeenCalledTimes(1);
    expect(onPill).toHaveBeenCalledTimes(1);
  });

  it('gives no feedback for a disabled button', async () => {
    await render(<PillButton label="Save" disabled onPress={() => undefined} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(haptics.tap).not.toHaveBeenCalled();
  });
});
