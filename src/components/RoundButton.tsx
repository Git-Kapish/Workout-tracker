import { StyleSheet } from 'react-native';

import { radius, size, useTheme } from '@/theme';

import { GlassSurface } from './GlassSurface';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

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
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.9}
      style={[styles.hit, busy && styles.busy]}
    >
      <GlassSurface interactive style={styles.glass}>
        <Icon name={icon} color={colors.ink} size={20} strokeWidth={2} />
      </GlassSurface>
    </PressableScale>
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
  busy: { opacity: 0.5 },
});
