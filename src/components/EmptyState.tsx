import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/theme';

import { PillButton } from './PillButton';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
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
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.card,
  },
  message: { textAlign: 'center' },
});
