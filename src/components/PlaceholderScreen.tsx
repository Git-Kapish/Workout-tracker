import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, typography, useTheme } from '@/theme';

// Phase 0 stand-in; each tab is replaced by its real screen in a later phase.
export function PlaceholderScreen({ title, note }: { title: string; note: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top + spacing.lg }]}
    >
      <Text style={[typography.screenTitle, { color: colors.ink }]}>{title}</Text>
      <Text style={[typography.body, { color: colors.inkMuted }]}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.screenX, gap: spacing.sm },
});
