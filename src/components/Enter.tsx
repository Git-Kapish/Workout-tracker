import { useEffect, useState, type ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';

/** Rows past this index appear instantly: scrolling a long list must not stagger. */
const ANIMATED_ROWS = 8;
const STAGGER_MS = 35;

interface EnterProps {
  /** Position in a list; later items start a little later. */
  index?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/** Fades and rises into place once when it first appears (opacity and transform only). */
export function Enter({ index = 0, style, children }: EnterProps) {
  const reduceMotion = useReduceMotion();
  const animate = index < ANIMATED_ROWS && !reduceMotion;
  const [progress] = useState(() => new Animated.Value(animate ? 0 : 1));

  useEffect(() => {
    if (!animate) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      delay: index * STAGGER_MS,
      useNativeDriver: true,
    }).start();
  }, [animate, index, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
