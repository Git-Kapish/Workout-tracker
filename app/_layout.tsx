import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { DatabaseProvider } from '@/hooks/DatabaseProvider';
import { spacing, typography, useTheme } from '@/theme';

function Centered({ title, message }: { title?: string; message?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.centered, { backgroundColor: colors.bg }]}>
      {title ? <Text style={[typography.screenTitle, { color: colors.ink }]}>{title}</Text> : null}
      {message ? (
        <Text style={[typography.body, { color: colors.inkMuted }]}>{message}</Text>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <DatabaseProvider
      loading={<Centered />}
      // Phase 6 replaces this with the designed ErrorFallback.
      renderError={(error) => <Centered title="Couldn't open your data." message={error.message} />}
    >
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
        <Stack.Screen name="log" options={{ presentation: 'modal' }} />
      </Stack>
    </DatabaseProvider>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, padding: spacing.screenX, gap: spacing.sm, justifyContent: 'center' },
});
