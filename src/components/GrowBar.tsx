import { useEffect, useState } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';

// A strong ease-out: fast start, long soft landing.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

interface GrowBarProps {
  /** Position in the chart; later bars start a little later, left to right. */
  index: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * A chart bar that grows up from its baseline when it appears. It is scaled (transform), not
 * resized, so no layout runs per frame; the 3% start keeps it from ever being scale(0).
 */
export function GrowBar({ index, style, testID }: GrowBarProps) {
  const reduceMotion = useReduceMotion();
  const [grow] = useState(() => new Animated.Value(reduceMotion ? 1 : 0.03));

  useEffect(() => {
    if (reduceMotion) {
      grow.setValue(1);
      return;
    }
    const animation = Animated.timing(grow, {
      toValue: 1,
      duration: 480,
      delay: index * 40,
      easing: EASE_OUT,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [grow, index, reduceMotion]);

  return (
    <Animated.View
      testID={testID}
      style={[style, { transformOrigin: 'bottom', transform: [{ scaleY: grow }] }]}
    />
  );
}
