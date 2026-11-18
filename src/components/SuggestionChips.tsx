import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { sameExercise } from '@/lib/exercises';
import { radius, size, spacing, typography, useTheme } from '@/theme';

interface SuggestionChipsProps {
  names: readonly string[];
  /** The text currently typed; a chip that matches it is shown selected. */
  current: string;
  onSelect: (name: string) => void;
}

export function SuggestionChips({ names, current, onSelect }: SuggestionChipsProps) {
  const { colors } = useTheme();
  if (names.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.row}
      accessibilityLabel="Suggested exercises"
    >
      {names.map((name) => {
        const selected = sameExercise(name, current);
        return (
          <Pressable
            key={name}
            accessibilityRole="button"
            accessibilityLabel={`Use ${name}`}
            accessibilityState={{ selected }}
            onPress={() => onSelect(name)}
            style={[styles.chip, { backgroundColor: selected ? colors.ink : colors.fieldBg }]}
          >
            <Text
              style={[
                typography.body,
                {
                  color: selected ? colors.surface : colors.ink,
                  fontWeight: selected ? '600' : '500',
                },
              ]}
            >
              {name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
  chip: {
    height: size.chip,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    justifyContent: 'center',
  },
});
