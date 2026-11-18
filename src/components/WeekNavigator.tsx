import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, typography, useTheme } from '@/theme';

import { RoundButton } from './RoundButton';

interface WeekNavigatorProps {
  /** e.g. 'Nov 16 – Nov 22' */
  label: string;
  /** e.g. 'This week', 'Last week' */
  caption: string;
  isCurrentWeek: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onJumpToToday: () => void;
  /** Put the "This week" link on its own line (for long captions). */
  stackJump?: boolean;
}

export function WeekNavigator({
  label,
  caption,
  isCurrentWeek,
  onPrevious,
  onNext,
  onJumpToToday,
  stackJump = false,
}: WeekNavigatorProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const jump = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to this week"
      hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
      onPress={onJumpToToday}
    >
      <Text style={[styles.caption, { color: colors.accentText, fontWeight: '600' }]}>
        This week
      </Text>
    </Pressable>
  );

  return (
    <View testID="week-navigator-row" style={[styles.row, { paddingTop: insets.top + spacing.sm }]}>
      <RoundButton icon="chevronLeft" label="Previous week" onPress={onPrevious} />
      <View style={styles.center}>
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>
          {label}
        </Text>
        <View style={styles.captionRow}>
          <Text style={[styles.caption, { color: colors.inkMuted }]}>{caption}</Text>
          {isCurrentWeek || stackJump ? null : (
            <>
              <Text style={[styles.caption, { color: colors.inkMuted }]}>·</Text>
              {jump}
            </>
          )}
        </View>
        {/* The stacked link's line is always reserved, so nothing below or beside it moves. */}
        {stackJump ? (
          <View testID="jump-slot" style={styles.jumpSlot}>
            {isCurrentWeek ? null : jump}
          </View>
        ) : null}
      </View>
      <RoundButton icon="chevronRight" label="Next week" onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    // Top-aligned, not centred: the buttons stay put however tall the title block gets.
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
  },
  center: { alignItems: 'center', gap: 2, flexShrink: 1 },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  caption: { fontSize: 13 },
  jumpSlot: { minHeight: 20, justifyContent: 'center' },
});
