import { StyleSheet, Text, View } from 'react-native';

import { formatEntryDetail, formatEntryTotals } from '@/lib/format';
import type { Entry } from '@/lib/types';
import { radius, size, spacing, typography, useTheme } from '@/theme';

import { IconTile } from './IconTile';
import { PressableScale } from './PressableScale';

interface EntryRowProps {
  entry: Entry;
  /** Tapping opens the entry for editing. */
  onPress: () => void;
}

export function EntryRow({ entry, onPress }: EntryRowProps) {
  const { colors } = useTheme();
  const detail = formatEntryDetail(entry);
  const totals = formatEntryTotals(entry);

  return (
    <PressableScale
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={`${entry.exerciseName}, ${detail}, ${totals.reps}. Edit`}
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surface }]}
    >
      <IconTile icon="dumbbell" />
      {/* minWidth 0 + numberOfLines: long names truncate instead of pushing the totals off. */}
      <View style={styles.main}>
        <Text numberOfLines={1} style={[typography.rowTitle, { color: colors.ink }]}>
          {entry.exerciseName}
        </Text>
        <Text numberOfLines={1} style={[typography.body, { color: colors.inkMuted }]}>
          {detail}
        </Text>
      </View>
      <View style={styles.totals}>
        <Text style={[typography.rowTitle, { color: colors.ink }]}>{totals.reps}</Text>
        <Text style={[typography.caption, styles.volume, { color: colors.inkMuted }]}>
          {totals.volume}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: size.entryRowMin,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.card,
  },
  main: { flex: 1, minWidth: 0, gap: 2 },
  totals: { alignItems: 'flex-end', flexShrink: 0, gap: 2 },
  volume: { fontSize: 13 },
});
