import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, size, spacing, typography, useTheme } from '@/theme';

import { Icon } from './Icon';

interface WeekNavigatorProps {
  /** e.g. 'Nov 16 – Nov 22' */
  label: string;
  /** e.g. 'This week', 'Last week' */
  caption: string;
  isCurrentWeek: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onJumpToToday: () => void;
}

function RoundButton({
  icon,
  label,
  onPress,
}: {
  icon: 'chevronLeft' | 'chevronRight';
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.round, { backgroundColor: colors.surface }]}
    >
      <Icon name={icon} color={colors.ink} size={20} strokeWidth={2} />
    </Pressable>
  );
}

export function WeekNavigator({
  label,
  caption,
  isCurrentWeek,
  onPrevious,
  onNext,
  onJumpToToday,
}: WeekNavigatorProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + spacing.sm }]}>
      <RoundButton icon="chevronLeft" label="Previous week" onPress={onPrevious} />
      <View style={styles.center}>
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>
          {label}
        </Text>
        <View style={styles.captionRow}>
          <Text style={[styles.caption, { color: colors.inkMuted }]}>{caption}</Text>
          {isCurrentWeek ? null : (
            <>
              <Text style={[styles.caption, { color: colors.inkMuted }]}>·</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to this week"
                hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
                onPress={onJumpToToday}
              >
                <Text style={[styles.caption, { color: colors.accent, fontWeight: '600' }]}>
                  This week
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
      <RoundButton icon="chevronRight" label="Next week" onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
  },
  round: {
    width: size.closeButton,
    height: size.closeButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center', gap: 2, flexShrink: 1 },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  caption: { fontSize: 13 },
});
