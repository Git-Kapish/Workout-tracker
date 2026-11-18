import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, size, spacing, typography, useTheme } from '@/theme';

import { Icon } from './Icon';

interface ScreenHeaderProps {
  /** Pill on the left, e.g. 'Nov 17'. */
  datePill: string;
  /** Lower-case title with a full stop, e.g. 'good evening.' */
  title: string;
  /** Optional round button on the right (the CSV export button arrives in Phase 6). */
  right?: ReactNode;
}

export function ScreenHeader({ datePill, title, right }: ScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + spacing.sm }]}>
      <View style={[styles.pill, { backgroundColor: colors.surface }]}>
        <Icon name="calendar" color={colors.ink} size={16} strokeWidth={2} />
        <Text style={[typography.body, styles.pillText, { color: colors.ink }]}>{datePill}</Text>
      </View>
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>
        {title}
      </Text>
      {/* Keeps the title visually balanced when there is no right-hand button. */}
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
  },
  pill: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: radius.full,
  },
  pillText: { fontWeight: '600' },
  right: { minWidth: size.closeButton, alignItems: 'flex-end' },
});
