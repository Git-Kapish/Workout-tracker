import { Pressable, StyleSheet } from 'react-native';

import { radius, size, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';

interface RoundButtonProps {
  icon: IconName;
  /** Spoken label; also what tests find it by. */
  label: string;
  onPress: () => void;
}

/** The white 44pt circle used for previous/next/back. */
export function RoundButton({ icon, label, onPress }: RoundButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.round, { backgroundColor: colors.surface }]}
    >
      <Icon name={icon} color={colors.ink} size={20} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  round: {
    width: size.closeButton,
    height: size.closeButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
