import { router } from 'expo-router';
import { useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

import { radius, size, useTheme } from '@/theme';

import { GlassSurface } from './GlassSurface';
import { Icon } from './Icon';

/** Width of the touch strip along the left edge. Narrow, so it never steals taps from content. */
const EDGE = 16;
const TRAVEL = 120;
const COMMIT_DISTANCE = 70;
const COMMIT_VELOCITY = 0.6;

/**
 * Swipe right from the left edge of the screen to go back, anywhere in the app (the iOS
 * gesture): a glass arrow follows the finger and the app goes back when you let go past the
 * threshold or flick. Does nothing where there is nowhere to go back to.
 */
export function EdgeSwipeBack() {
  const { colors } = useTheme();
  const [drag] = useState(() => new Animated.Value(0));

  const [pan] = useState(() => {
    const reset = () =>
      Animated.spring(drag, {
        toValue: 0,
        speed: 20,
        bounciness: 4,
        useNativeDriver: true,
      }).start();
    return PanResponder.create({
      onStartShouldSetPanResponder: () => router.canGoBack(),
      onMoveShouldSetPanResponder: () => router.canGoBack(),
      onPanResponderMove: (_, g) => drag.setValue(Math.min(Math.max(g.dx, 0), TRAVEL)),
      onPanResponderRelease: (_, g) => {
        reset();
        if (g.dx > COMMIT_DISTANCE || g.vx > COMMIT_VELOCITY) router.back();
      },
      onPanResponderTerminate: reset,
    });
  });

  return (
    <>
      <View
        testID="edge-swipe-back"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.strip}
        {...pan.panHandlers}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.arrow,
          {
            opacity: drag.interpolate({
              inputRange: [0, 40],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                translateX: drag.interpolate({
                  inputRange: [0, TRAVEL],
                  outputRange: [-size.closeButton, 12],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <GlassSurface style={styles.glass}>
          <Icon name="chevronLeft" color={colors.ink} size={20} strokeWidth={2.2} />
        </GlassSurface>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  strip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: EDGE },
  arrow: { position: 'absolute', left: 0, top: '50%', marginTop: -size.closeButton / 2 },
  glass: {
    width: size.closeButton,
    height: size.closeButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
