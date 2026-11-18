import { router } from 'expo-router';
import { useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import { haptics } from '@/platform/haptics';

/** Width of the touch strip along the left edge. Narrow, so it never steals taps from content. */
const EDGE = 16;
const COMMIT_DISTANCE = 70;
const COMMIT_VELOCITY = 0.6;

/**
 * Swipe right from the left edge of the screen to go back, anywhere in the app (the iOS
 * gesture). There is nothing drawn: it goes back when you let go past the threshold or flick,
 * with a light tap. Does nothing where there is nowhere to go back to.
 */
export function EdgeSwipeBack() {
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => router.canGoBack(),
      onMoveShouldSetPanResponder: () => router.canGoBack(),
      onPanResponderRelease: (_, g) => {
        if (g.dx > COMMIT_DISTANCE || g.vx > COMMIT_VELOCITY) {
          haptics.tap();
          router.back();
        }
      },
    }),
  );

  return (
    <View
      testID="edge-swipe-back"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.strip}
      {...pan.panHandlers}
    />
  );
}

const styles = StyleSheet.create({
  strip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: EDGE },
});
