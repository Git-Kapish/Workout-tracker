import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRepositoryQuery } from '@/hooks/useRepositoryQuery';
import { addMonths, formatMonthTitle, gridRange, monthGrid, monthStart } from '@/lib/calendar';
import { formatLongDate } from '@/lib/format';
import { WEEKDAYS_MIN } from '@/lib/labels';
import { parseLocalDate } from '@/lib/dates';
import type { DateString } from '@/lib/types';
import { radius, spacing, typography, useTheme } from '@/theme';

import { PillButton } from './PillButton';
import { PressableScale } from './PressableScale';
import { RoundButton } from './RoundButton';

interface CalendarSheetProps {
  visible: boolean;
  /** The day currently shown on Today; the sheet opens on its month. */
  selected: DateString;
  today: DateString;
  onSelect: (date: DateString) => void;
  onClose: () => void;
}

/** A month calendar: a green line under every day that has at least one logged exercise. */
export function CalendarSheet({ visible, selected, today, onSelect, onClose }: CalendarSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <CalendarBody selected={selected} today={today} onSelect={onSelect} onClose={onClose} />
    </Modal>
  );
}

function CalendarBody({ selected, today, onSelect, onClose }: Omit<CalendarSheetProps, 'visible'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(() => monthStart(selected));

  const rows = useMemo(() => monthGrid(month), [month]);
  const range = useMemo(() => gridRange(month), [month]);
  const { data } = useRepositoryQuery(`calendar:${range.start}:${range.end}`, (r) =>
    r.getByDateRange(range.start, range.end),
  );
  const logged = useMemo(() => new Set((data ?? []).map((entry) => entry.date)), [data]);

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.bg, paddingBottom: Math.max(insets.bottom, spacing.lg) },
      ]}
    >
      <View style={styles.top}>
        <Text accessibilityRole="header" style={[typography.sheetTitle, { color: colors.ink }]}>
          calendar.
        </Text>
        <RoundButton icon="close" label="Close calendar" onPress={onClose} />
      </View>

      <View style={styles.monthRow}>
        <RoundButton
          icon="chevronLeft"
          label="Previous month"
          onPress={() => setMonth((m) => addMonths(m, -1))}
        />
        <Text accessibilityRole="header" style={[typography.rowTitle, { color: colors.ink }]}>
          {formatMonthTitle(month)}
        </Text>
        <RoundButton
          icon="chevronRight"
          label="Next month"
          onPress={() => setMonth((m) => addMonths(m, 1))}
        />
      </View>

      <View style={styles.weekdays}>
        {WEEKDAYS_MIN.map((label) => (
          <Text
            key={label}
            style={[typography.caption, styles.weekday, { color: colors.inkMuted }]}
          >
            {label}
          </Text>
        ))}
      </View>

      {rows.map((row) => (
        <View key={row[0]?.date} style={styles.week}>
          {row.map(({ date, inMonth }) => {
            const isLogged = logged.has(date);
            const isSelected = date === selected;
            const isToday = date === today;
            return (
              <PressableScale
                key={date}
                scaleTo={0.9}
                accessibilityRole="button"
                accessibilityLabel={`${formatLongDate(date)}${isToday ? ', today' : ''}${isLogged ? ', logged' : ''}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(date)}
                style={[
                  styles.day,
                  isSelected && { backgroundColor: colors.surface, borderColor: colors.ink },
                ]}
              >
                <Text
                  maxFontSizeMultiplier={1.3}
                  style={[
                    styles.dayNumber,
                    {
                      color: isToday ? colors.accentText : colors.ink,
                      opacity: inMonth ? 1 : 0.35,
                      fontWeight: isToday || isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {parseLocalDate(date)?.d}
                </Text>
                <View
                  testID={isLogged ? 'logged-mark' : 'empty-mark'}
                  style={[
                    styles.mark,
                    { backgroundColor: isLogged ? colors.trendUpFg : 'transparent' },
                  ]}
                />
              </PressableScale>
            );
          })}
        </View>
      ))}

      <View style={styles.legend}>
        <View style={[styles.mark, { backgroundColor: colors.trendUpFg }]} />
        <Text style={[typography.caption, { color: colors.inkMuted }]}>Logged exercises</Text>
      </View>

      <PillButton
        label="Go to today"
        variant="secondary"
        accessibilityLabel="Go to today"
        onPress={() => onSelect(today)}
        style={styles.today}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.screenX, paddingTop: spacing.xl, gap: spacing.xs },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  weekdays: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center' },
  week: { flexDirection: 'row' },
  day: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dayNumber: { fontSize: 17 },
  mark: { width: 18, height: 3, borderRadius: radius.full },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  today: { marginTop: spacing.md },
});
