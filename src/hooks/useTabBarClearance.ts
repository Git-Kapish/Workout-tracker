import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { floatingBar } from '@/theme';

/** Distance from the bottom screen edge to the bottom of the floating tab bar. */
export function tabBarBottomOffset(insetBottom: number): number {
  // Sit just above the home indicator; phones without one still get a margin.
  return insetBottom > 0 ? Math.max(insetBottom - 6, floatingBar.minBottom) : floatingBar.minBottom;
}

/**
 * Bottom padding scrollable screens need so their last row can be scrolled clear of the
 * floating tab bar (which overlays the content instead of reserving space).
 */
export function useTabBarClearance(): number {
  const { bottom } = useSafeAreaInsets();
  return tabBarBottomOffset(bottom) + floatingBar.height + floatingBar.contentGap;
}
