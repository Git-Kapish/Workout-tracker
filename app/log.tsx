import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, size, spacing, typography, useTheme } from '@/theme';

// Phase 0 placeholder for the add/edit sheet (DESIGN.md screen 3, built in Phase 2).
export default function LogModal() {
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Text style={[typography.sheetTitle, { color: colors.ink }]}>Log exercise</Text>
      <Text style={[typography.body, { color: colors.inkMuted }]}>
        Phase 2: the entry form goes here.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={() => router.back()}
        style={[styles.close, { backgroundColor: colors.ink }]}
      >
        <Text style={[typography.rowTitle, { color: colors.surface }]}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenX, gap: spacing.md, justifyContent: 'center' },
  close: {
    height: size.pillButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
});
