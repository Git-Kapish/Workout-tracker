import { Pressable, StyleSheet, Text } from 'react-native';

import { formatEntryDetail, formatEntryTotals, formatShortDate } from '@/lib/format';
import type { DateString, Entry } from '@/lib/types';
import { radius, spacing, typography, useTheme } from '@/theme';

interface HistoryRowProps {
  entry: Entry;
  today: DateString;
  /** Tapping opens the entry for editing. */
  onPress: () => void;
}

export function HistoryRow({ entry, today, onPress }: HistoryRowProps) {
  const { colors } = useTheme();
  const date = formatShortDate(entry.date, today);
  const detail = formatEntryDetail(entry);
  const volume = formatEntryTotals(entry).volume;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${date}, ${detail}, ${volume}. Edit`}
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surface }]}
    >
      <Text style={[styles.date, { color: colors.ink }]}>{date}</Text>
      <Text numberOfLines={1} style={[typography.body, styles.detail, { color: colors.inkMuted }]}>
        {detail}
      </Text>
      <Text style={[styles.volume, { color: colors.ink }]}>{volume}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.historyRow,
  },
  date: { minWidth: 64, fontSize: 14, fontWeight: '600' },
  detail: { flex: 1, minWidth: 0, fontWeight: '400' },
  volume: { fontSize: 14, fontWeight: '600' },
});
