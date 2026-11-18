import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { radius, size, spacing, typography, useTheme } from '@/theme';

interface PillButtonProps {
  label: string;
  onPress: () => void;
  /** primary: black on light. inverse: white on the dark hero card. secondary: grey field. */
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
  const foreground = { primary: colors.surface, inverse: colors.ink, secondary: colors.ink }[
    variant
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.base,
        compact ? styles.compact : styles.regular,
        { backgroundColor: background, opacity: disabled ? 0.4 : 1 },
        style,
      ]}
    >
      <Text style={[typography.rowTitle, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  regular: { height: size.pillButton },
  compact: { height: 48, paddingHorizontal: spacing.xl + spacing.xs },
});
