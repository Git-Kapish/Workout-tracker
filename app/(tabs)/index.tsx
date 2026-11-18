import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { spacing, typography, useTheme } from '@/theme';

export default function TodayScreen() {
  const { colors } = useTheme();
  return (
    <>
      <PlaceholderScreen title="today." note="Phase 2: today's log and hero card." />
      {/* TEMPORARY Phase 1 gate: remove with app/debug.tsx. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open debug screen"
        onPress={() => router.push('/debug')}
        style={{
          position: 'absolute',
          left: spacing.screenX,
          top: 140,
          minHeight: 44,
          justifyContent: 'center',
        }}
      >
        <Text style={[typography.rowTitle, { color: colors.accent }]}>Debug: database →</Text>
      </Pressable>
    </>
  );
}
