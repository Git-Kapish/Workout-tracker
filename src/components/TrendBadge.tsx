import { StyleSheet, Text, View } from 'react-native';

import { formatPercent } from '@/lib/format';
import type { Trend } from '@/lib/types';
import { radius, size, spacing, typography, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';

interface TrendBadgeProps {
  trend: Trend;
  /** null when there is no baseline. */
  percent: number | null;
  /** Appended after the percentage, e.g. ' vs last week'. */
  suffix?: string;
}

const ICONS: Record<Exclude<Trend, 'no-baseline'>, IconName> = {
  up: 'arrowUp',
  down: 'arrowDown',
  same: 'minus',
};

// Meaning is always carried by an arrow or words plus the number, never by colour alone.
export function TrendBadge({ trend, percent, suffix = '' }: TrendBadgeProps) {
  const { colors } = useTheme();
  const palette = {
    up: { bg: colors.trendUpBg, fg: colors.trendUpFg },
    down: { bg: colors.trendDownBg, fg: colors.trendDownFg },
    same: { bg: colors.trendNeutralBg, fg: colors.trendNeutralFg },
    'no-baseline': { bg: colors.trendNeutralBg, fg: colors.trendNeutralFg },
  }[trend];

  const label = trend === 'no-baseline' ? 'No baseline' : `${formatPercent(percent)}${suffix}`;

  return (
    <View
      accessible
      accessibilityLabel={`${trend === 'no-baseline' ? 'No baseline' : `${trend}, ${label}`}`}
      style={[styles.badge, { backgroundColor: palette.bg }]}
    >
      {trend !== 'no-baseline' ? (
        <Icon name={ICONS[trend]} color={palette.fg} size={12} strokeWidth={2.6} />
      ) : null}
      <Text style={[typography.body, styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: size.trendBadge,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 13, fontWeight: '600' },
});
