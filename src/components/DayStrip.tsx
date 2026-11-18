import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { haptics } from '@/platform/haptics';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { parseLocalDate } from '@/lib/dates';
import { formatLongDate } from '@/lib/format';
import { WEEKDAYS_MIN } from '@/lib/labels';
import type { DateString } from '@/lib/types';
import { radius, size, spacing, typography, useTheme } from '@/theme';

import { PressableScale } from './PressableScale';

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
  /** Omit for a read-only strip. */
  onSelect?: (date: DateString) => void;
}

export function DayStrip({ days, today, selected, onSelect }: DayStripProps) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const selectedIndex = days.findIndex((d) => d.date === selected);

  // The selection ring is one view that springs between cells, so a tap reads as movement
  // rather than a swap. Cell positions come from layout; the first placement does not animate.
  const cellX = useRef<number[]>([]);
  const [ringX] = useState(() => new Animated.Value(0));
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    const target = cellX.current[selectedIndex];
    if (!placed || target === undefined) return;
    if (reduceMotion) {
      ringX.setValue(target);
      return;
    }
    Animated.spring(ringX, {
      toValue: target,
      speed: 22,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  }, [selectedIndex, placed, reduceMotion, ringX]);

  return (
    <View style={styles.row}>
      {selectedIndex >= 0 && placed ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              borderColor: colors.ink,
              backgroundColor: colors.surface,
              transform: [{ translateX: ringX }],
            },
          ]}
        />
      ) : null}
      {days.map(({ date, hasEntries }, index) => {
        const isSelected = date === selected;
        const isToday = date === today;
        const label = `${formatLongDate(date)}${isToday ? ', today' : ''}${hasEntries ? ', has entries' : ''}`;
        return (
          <PressableScale
            key={date}
            scaleTo={0.92}
            disabled={!onSelect}
            onPress={() => {
              if (date !== selected) haptics.selection();
              onSelect?.(date);
            }}
            onLayout={(event) => {
              cellX.current[index] = event.nativeEvent.layout.x;
              if (index === selectedIndex && !placed) {
                ringX.setValue(event.nativeEvent.layout.x);
                setPlaced(true);
              }
            }}
            accessibilityRole={onSelect ? 'button' : 'text'}
            accessibilityLabel={label}
            accessibilityState={{ selected: isSelected }}
            style={styles.cell}
          >
            <Text
              maxFontSizeMultiplier={1.3}
              style={[typography.caption, { color: colors.inkMuted }]}
            >
              {WEEKDAYS_MIN[index]}
            </Text>
            <Text
              maxFontSizeMultiplier={1.3}
              style={[styles.day, { color: isToday ? colors.accentText : colors.ink }]}
            >
              {parseLocalDate(date)?.d}
            </Text>
            <View
              style={[styles.dot, { backgroundColor: hasEntries ? colors.ink : 'transparent' }]}
            />
          </PressableScale>
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
  ring: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: size.dayCellW,
    height: size.dayCellH,
    borderRadius: radius.input,
    borderWidth: 1.5,
  },
  cell: {
    width: size.dayCellW,
    height: size.dayCellH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  day: { fontSize: 17, fontWeight: '600' },
  dot: { width: 5, height: 5, borderRadius: radius.full },
});
