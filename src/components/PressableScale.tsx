import { useState } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  /** How small it gets while a finger is down. */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A Pressable that shrinks under the finger and springs back. It reacts on press-in (not on
 * release) and only animates transform, so it runs on the UI thread and never delays the tap.
 */
export function PressableScale({
  scaleTo = 0.96,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const reduceMotion = useReduceMotion();

  const spring = (toValue: number) => {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue,
      speed: toValue < 1 ? 60 : 24,
      bounciness: toValue < 1 ? 0 : 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e: GestureResponderEvent) => {
        spring(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        spring(1);
        onPressOut?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
    />
  );
}
