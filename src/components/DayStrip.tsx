import { Pressable, StyleSheet, Text, View } from 'react-native';

import { parseLocalDate } from '@/lib/dates';
import { formatLongDate } from '@/lib/format';
import { WEEKDAYS_MIN } from '@/lib/labels';
import type { DateString } from '@/lib/types';
import { radius, size, spacing, typography, useTheme } from '@/theme';

export interface StripDay {
  date: DateString;
  hasEntries: boolean;
}

interface DayStripProps {
  /** Seven days, Monday first. */
  days: readonly StripDay[];
  today: DateString;
  /** The highlighted day (1.5pt ink border). */
  selected?: DateString;
  /** Omit for a read-only strip (Today tab). */
  onSelect?: (date: DateString) => void;
}

export function DayStrip({ days, today, selected, onSelect }: DayStripProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {days.map(({ date, hasEntries }, index) => {
        const isSelected = date === selected;
        const isToday = date === today;
        const label = `${formatLongDate(date)}${isToday ? ', today' : ''}${hasEntries ? ', has entries' : ''}`;
        return (
          <Pressable
            key={date}
            disabled={!onSelect}
            onPress={() => onSelect?.(date)}
            accessibilityRole={onSelect ? 'button' : 'text'}
            accessibilityLabel={label}
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.cell,
              {
                borderColor: isSelected ? colors.ink : 'transparent',
                backgroundColor: isSelected ? colors.surface : 'transparent',
              },
            ]}
          >
            <Text style={[typography.caption, { color: colors.inkMuted }]}>
              {WEEKDAYS_MIN[index]}
            </Text>
            <Text style={[styles.day, { color: isToday ? colors.accent : colors.ink }]}>
              {parseLocalDate(date)?.d}
            </Text>
            <View
              style={[styles.dot, { backgroundColor: hasEntries ? colors.ink : 'transparent' }]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  cell: {
    width: size.dayCellW,
    height: size.dayCellH,
    borderRadius: radius.input,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  day: { fontSize: 17, fontWeight: '600' },
  dot: { width: 5, height: 5, borderRadius: radius.full },
});
