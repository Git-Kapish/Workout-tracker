import { StyleSheet, Text, View } from 'react-native';

import { radius, size, spacing, typography, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { PillButton } from './PillButton';

interface EmptyStateProps {
  title: string;
  message?: string;
  /** Round icon above the title (used for rest days). */
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, icon, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {icon ? (
        <View style={[styles.iconCircle, { backgroundColor: colors.fieldBg }]}>
          <Icon name={icon} color={colors.inkMuted} size={22} />
        </View>
      ) : null}
      <Text style={[typography.rowTitle, { color: colors.ink }]}>{title}</Text>
      {message ? (
        <Text style={[typography.body, styles.message, { color: colors.inkMuted }]}>{message}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <PillButton label={actionLabel} onPress={onAction} variant="secondary" compact />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 6,
    padding: spacing.xl,
    borderRadius: radius.card,
  },
  iconCircle: {
    width: size.tile,
    height: size.tile,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { textAlign: 'center' },
});
