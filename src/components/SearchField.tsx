import { StyleSheet, TextInput, View } from 'react-native';

import { radius, size, typography, useTheme } from '@/theme';

import { Icon } from './Icon';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search exercises',
}: SearchFieldProps) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.field, { backgroundColor: colors.surface }]}>
      <Icon name="search" color={colors.inkMuted} size={20} strokeWidth={1.9} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        selectionColor={colors.accent}
        keyboardAppearance={isDark ? 'dark' : 'light'}
        inputMode="search"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={[styles.input, { color: colors.ink }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    borderRadius: radius.full,
  },
  input: {
    ...typography.rowTitle,
    flex: 1,
    minWidth: 0,
    minHeight: size.tapMin,
    fontWeight: '400',
  },
});
