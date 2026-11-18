// Developer-only screen for checking performance with ~5,000 entries on a real phone
// (plan.md Phase 6). Reached by long-pressing the Today greeting in a dev build such as
// Expo Go; in a release build (`__DEV__` false) it redirects away and cannot be used.
import { Redirect, router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PillButton } from '@/components/PillButton';
import { useDebugTools } from '@/hooks/useDebugTools';
import { spacing, typography, useTheme } from '@/theme';

const SEED_AMOUNT = 5000;

export default function DebugScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DebugTools />;
}

function DebugTools() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { busy, status, count, seed, clearSeed } = useDebugTools();

  const confirmSeed = () =>
    Alert.alert(
      `Add ${SEED_AMOUNT} fake entries?`,
      'They are named "Seed Exercise NN" and can be removed with the button below. Your own entries are not touched.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: () => void seed(SEED_AMOUNT) },
      ],
    );

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>
        debug.
      </Text>
      <Text style={[typography.body, { color: colors.inkMuted, fontWeight: '400' }]}>
        Developer tools. Add fake data, then check that every tab opens quickly and scrolls
        smoothly. Remove it afterwards.
      </Text>
      <Text accessibilityLiveRegion="polite" style={[typography.rowTitle, { color: colors.ink }]}>
        {busy ? status || 'Working…' : status}
      </Text>
      <PillButton label={`Add ${SEED_AMOUNT} fake entries`} onPress={confirmSeed} disabled={busy} />
      <PillButton
        label="Remove fake entries"
        onPress={() => void clearSeed()}
        disabled={busy}
        variant="secondary"
      />
      <PillButton
        label="Count entries"
        onPress={() => void count()}
        disabled={busy}
        variant="secondary"
      />
      <PillButton label="Back" onPress={() => router.back()} variant="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenX, gap: spacing.md },
});
