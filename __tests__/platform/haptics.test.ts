import * as ExpoHaptics from 'expo-haptics';

import { haptics } from '@/platform/haptics';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => undefined),
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

beforeEach(() => jest.clearAllMocks());

describe('haptics', () => {
  it('maps each moment to the right feedback', () => {
    haptics.selection();
    haptics.tap();
    haptics.success();
    haptics.warning();
    expect(ExpoHaptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(ExpoHaptics.impactAsync).toHaveBeenCalledWith('light');
    expect(ExpoHaptics.notificationAsync).toHaveBeenCalledWith('success');
    expect(ExpoHaptics.notificationAsync).toHaveBeenCalledWith('warning');
  });

  it('never throws when the device has no haptics (sync failure)', () => {
    jest.mocked(ExpoHaptics.selectionAsync).mockImplementation(() => {
      throw new Error('no engine');
    });
    expect(() => haptics.selection()).not.toThrow();
  });

  it('never rejects loudly when haptics fail asynchronously', async () => {
    jest.mocked(ExpoHaptics.impactAsync).mockRejectedValue(new Error('disabled'));
    expect(() => haptics.tap()).not.toThrow();
    await Promise.resolve();
  });
});
