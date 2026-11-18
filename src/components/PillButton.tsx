import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '@/platform/haptics';
import { radius, size, spacing, typography, useTheme } from '@/theme';

import { PressableScale } from './PressableScale';

interface PillButtonProps {
  label: string;
  onPress: () => void;
  /** primary: black on light. inverse: white with dark text, for the always-dark hero card (the dark label is the hero's own colour, so it stays readable in dark mode). secondary: grey field. */
  variant?: 'primary' | 'inverse' | 'secondary';
  disabled?: boolean;
  /** Shorter pill used inside cards. */
  compact?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function PillButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  compact = false,
  accessibilityLabel,
  style,
}: PillButtonProps) {
  const { colors } = useTheme();
  const background = { primary: colors.ink, inverse: colors.onHero, secondary: colors.fieldBg }[
    variant
  ];
  const foreground = { primary: colors.surface, inverse: colors.heroTo, secondary: colors.ink }[
    variant
  ];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={[
        styles.base,
        compact ? styles.compact : styles.regular,
        { backgroundColor: background, opacity: disabled ? 0.4 : 1 },
        style,
      ]}
    >
      <Text style={[typography.rowTitle, { color: foreground }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  regular: { minHeight: size.pillButton },
  compact: { minHeight: 48, paddingHorizontal: spacing.xl + spacing.xs },
});
