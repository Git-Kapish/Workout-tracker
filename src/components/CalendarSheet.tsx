import { useCallback, useMemo, useState } from 'react';
import { Animated, Modal, PanResponder, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useRepositoryQuery } from '@/hooks/useRepositoryQuery';
import { addMonths, formatMonthTitle, gridRange, monthGrid, monthStart } from '@/lib/calendar';
import { formatLongDate } from '@/lib/format';
import { WEEKDAYS_MIN } from '@/lib/labels';
import { parseLocalDate } from '@/lib/dates';
import type { DateString } from '@/lib/types';
import { haptics } from '@/platform/haptics';
import { radius, spacing, typography, useTheme } from '@/theme';

import { PillButton } from './PillButton';
import { PressableScale } from './PressableScale';
import { RoundButton } from './RoundButton';

const SLIDE = 48;
const SWIPE_DISTANCE = 50;
const SWIPE_VELOCITY = 0.5;

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

  const reduceMotion = useReduceMotion();
  const [slide] = useState(() => new Animated.Value(0));

  // Moving a month slides the new grid in from the side the finger (or arrow) points to.
  const shiftMonth = useCallback(
    (delta: number) => {
      haptics.selection();
      setMonth((m) => addMonths(m, delta));
      if (reduceMotion) return;
      slide.setValue(delta * SLIDE);
      Animated.spring(slide, {
        toValue: 0,
        speed: 18,
        bounciness: 4,
        useNativeDriver: true,
      }).start();
    },
    [reduceMotion, slide],
  );

  // Swipe the grid: left for the next month, right for the previous one.
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_, g) => {
          if (g.dx < -SWIPE_DISTANCE || g.vx < -SWIPE_VELOCITY) shiftMonth(1);
          else if (g.dx > SWIPE_DISTANCE || g.vx > SWIPE_VELOCITY) shiftMonth(-1);
        },
      }),
    [shiftMonth],
  );

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
        <RoundButton icon="chevronLeft" label="Previous month" onPress={() => shiftMonth(-1)} />
        <Text accessibilityRole="header" style={[typography.rowTitle, { color: colors.ink }]}>
          {formatMonthTitle(month)}
        </Text>
        <RoundButton icon="chevronRight" label="Next month" onPress={() => shiftMonth(1)} />
      </View>

      <Animated.View
        testID="calendar-grid"
        {...swipe.panHandlers}
        style={{
          opacity: slide.interpolate({
            inputRange: [-SLIDE, 0, SLIDE],
            outputRange: [0.2, 1, 0.2],
            extrapolate: 'clamp',
          }),
          transform: [{ translateX: slide }],
        }}
      >
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
                  onPress={() => {
                    haptics.selection();
                    onSelect(date);
                  }}
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
      </Animated.View>

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
