import { Pressable, StyleSheet, Text, View } from 'react-native';

import { bestOf, type ExerciseSummary } from '@/lib/exercises';
import { formatBest, formatLastDone } from '@/lib/format';
import type { DateString } from '@/lib/types';
import { radius, spacing, typography, useTheme } from '@/theme';

import { Icon } from './Icon';
import { IconTile } from './IconTile';

interface ExerciseRowProps {
  exercise: ExerciseSummary;
  today: DateString;
  onPress: () => void;
}

export function ExerciseRow({ exercise, today, onPress }: ExerciseRowProps) {
  const { colors } = useTheme();
  const best = bestOf(exercise.bests);
  const lastDone = formatLastDone(exercise.lastDate, today);
  const bestText = best ? formatBest(best) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${exercise.name}. ${lastDone}.${bestText ? ` Best ${bestText}.` : ''}`}
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surface }]}
    >
      <IconTile icon="dumbbell" />
      {/* minWidth 0 + numberOfLines: long names truncate instead of pushing "Best" off screen. */}
      <View style={styles.main}>
        <Text numberOfLines={1} style={[typography.rowTitle, { color: colors.ink }]}>
          {exercise.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[typography.caption, styles.sub, { color: colors.inkMuted }]}
        >
          {lastDone}
        </Text>
      </View>
      {bestText ? (
        <View style={styles.best}>
          <Text style={[typography.caption, { color: colors.inkMuted }]}>Best</Text>
          <Text style={[styles.bestValue, { color: colors.ink }]}>{bestText}</Text>
        </View>
      ) : null}
      <Icon name="chevronRight" color={colors.inkMuted} size={16} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.card,
  },
  main: { flex: 1, minWidth: 0, gap: 2 },
  sub: { fontSize: 13 },
  best: { alignItems: 'flex-end', flexShrink: 0 },
  bestValue: { fontSize: 15, fontWeight: '600' },
});
