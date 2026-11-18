import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, size, spacing, typography, useTheme } from '@/theme';

import { GlassSurface } from './GlassSurface';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface ScreenHeaderProps {
  /** Pill on the left, e.g. 'Nov 17'. */
  datePill: string;
  /** Lower-case title with a full stop, e.g. 'good evening.' */
  title: string;
  /** Optional round button on the right (the CSV export button on Today). */
  right?: ReactNode;
  /** Opens the calendar when the date pill is tapped. */
  onDatePress?: () => void;
  /** Hidden developer gesture; pass undefined in release builds. */
  onTitleLongPress?: () => void;
}

export function ScreenHeader({
  datePill,
  title,
  right,
  onDatePress,
  onTitleLongPress,
}: ScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + spacing.sm }]}>
      <PressableScale
        scaleTo={0.94}
        accessibilityRole="button"
        accessibilityLabel={`Open calendar, ${datePill}`}
        disabled={!onDatePress}
        onPress={onDatePress}
        style={styles.pillHit}
      >
        <GlassSurface interactive style={styles.pill}>
          <Icon name="calendar" color={colors.ink} size={16} strokeWidth={2} />
          <Text style={[typography.body, styles.pillText, { color: colors.ink }]}>{datePill}</Text>
        </GlassSurface>
      </PressableScale>
      {/* Shrinks to fit when the right-hand buttons and a large text size leave little room. */}
      <Text
        accessibilityRole="header"
        onLongPress={onTitleLongPress}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[typography.screenTitle, styles.title, { color: colors.ink }]}
      >
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
    gap: spacing.sm,
    paddingHorizontal: spacing.screenX,
  },
  title: { flexShrink: 1, textAlign: 'center' },
  pillHit: { flexShrink: 0 },
  pill: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: radius.full,
  },
  pillText: { fontWeight: '600' },
  right: { flexShrink: 0, minWidth: size.closeButton, alignItems: 'flex-end' },
});
