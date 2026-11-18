import { Pressable, StyleSheet } from 'react-native';

import { radius, size, useTheme } from '@/theme';

import { GlassSurface } from './GlassSurface';
import { Icon, type IconName } from './Icon';

interface RoundButtonProps {
  icon: IconName;
  /** Spoken label; also what tests find it by. */
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Dims the button and tells screen readers it is working. */
  busy?: boolean;
}

/** A 44pt liquid-glass circle for previous / next / back / export / settings. */
export function RoundButton({
  icon,
  label,
  onPress,
  disabled = false,
  busy = false,
}: RoundButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      // Feedback lands on press-in: instant, no transition to wait for.
      style={({ pressed }) => [styles.hit, pressed && styles.pressed, busy && styles.busy]}
    >
      <GlassSurface interactive style={styles.glass}>
        <Icon name={icon} color={colors.ink} size={20} strokeWidth={2} />
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { width: size.closeButton, height: size.closeButton },
  glass: {
    width: size.closeButton,
    height: size.closeButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.95 }] },
  busy: { opacity: 0.5 },
});
