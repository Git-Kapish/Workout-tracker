import { StyleSheet, Text, View } from 'react-native';

import { formatOverallDetail, formatOverallHeadline, formatTrendWord } from '@/lib/format';
import type { MetricComparison, Trend } from '@/lib/types';
import { radius, spacing, typography, useTheme } from '@/theme';

import { DarkCard } from './DarkCard';
import { Icon, type IconName } from './Icon';

interface OverallCardProps {
  /** Total reps, this week vs the previous one (PRD §7.4: reps drive the overall status). */
  comparison: MetricComparison;
  /** 'last week' for the current week, otherwise 'prior week'. */
  previousLabel: string;
}

const TREND_ICONS: Record<Trend, IconName | null> = {
  up: 'arrowUp',
  down: 'arrowDown',
  same: 'minus',
  'no-baseline': null,
};

export function OverallCard({ comparison, previousLabel }: OverallCardProps) {
  const { colors } = useTheme();
  const { trend } = comparison;
  const tone = {
    up: colors.onHeroUp,
    down: colors.onHeroDown,
    same: colors.onHeroSoft,
    'no-baseline': colors.onHeroSoft,
  }[trend];
  const icon = TREND_ICONS[trend];
  const headline = formatOverallHeadline(comparison);
  const detail = formatOverallDetail(comparison, previousLabel);

  return (
    <DarkCard style={styles.card}>
      <View
        accessible
        accessibilityLabel={`Overall, total reps. ${headline}. ${detail}`}
        style={styles.text}
      >
        <Text style={[typography.caption, { color: colors.onHeroSoft }]}>Overall · total reps</Text>
        <Text style={[styles.headline, { color: colors.onHero }]}>{headline}</Text>
        <Text style={[typography.caption, { color: colors.onHeroSoft, fontSize: 13 }]}>
          {detail}
        </Text>
      </View>
      <View style={[styles.pill, { backgroundColor: colors.onHeroPill }]}>
        {icon ? <Icon name={icon} color={tone} size={14} strokeWidth={2.6} /> : null}
        <Text style={[typography.body, { color: tone, fontWeight: '600' }]}>
          {formatTrendWord(trend)}
        </Text>
      </View>
    </DarkCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: 22,
  },
  text: { flexShrink: 1, gap: 2 },
  headline: { fontSize: 32, fontWeight: '700', letterSpacing: -0.64 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.full,
  },
});
