import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/theme';

interface Option<T extends string> {
  value: T;
  label: string;
  /** Spoken label, e.g. 'Show reps'. Defaults to `label`. */
  accessibilityLabel?: string;
}

interface SegmentedToggleProps<T extends string> {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: colors.fieldBg }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityState={{ selected }}
            hitSlop={{ top: 5, bottom: 5 }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, { backgroundColor: selected ? colors.ink : 'transparent' }]}
          >
            <Text
              style={[
                typography.body,
                { fontSize: 13, fontWeight: '600', color: selected ? colors.surface : colors.ink },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', gap: spacing.xs, padding: 3, borderRadius: radius.full },
  segment: {
    height: 34,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
