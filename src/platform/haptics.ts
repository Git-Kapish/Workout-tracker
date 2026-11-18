import * as Haptics from 'expo-haptics';

// Haptics are a bonus, never a requirement: they are silent when the user turned them off or
// the device has no taptic engine, so a failure here must never reach the user.
function fire(run: () => Promise<void>): void {
  try {
    run().catch(() => undefined);
  } catch {
    // no haptics available
  }
}

export const haptics = {
  /** A value ticked to a new step: a day picked, a tab or month changed. */
  selection: () => fire(() => Haptics.selectionAsync()),
  /** A button was pressed or a gesture committed. */
  tap: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Something was saved. */
  success: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Something was removed. */
  warning: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
