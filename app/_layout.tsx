import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingState } from '@/components/LoadingState';
import { DatabaseProvider } from '@/hooks/DatabaseProvider';
import { useTheme } from '@/theme';

/** Any render error below the root lands here instead of a white screen or a crash. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('Unexpected error', error); // for developers only; users get a friendly screen
  }, [error]);
  return <ErrorFallback onRetry={() => void retry()} />;
}

function Splash() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
      <LoadingState />
    </View>
  );
}

export default function RootLayout() {
  const { colors } = useTheme();
  return (
    <DatabaseProvider
      loading={<Splash />}
      renderError={(_error, retry) => (
        <ErrorFallback
          title="Couldn't open your data"
          message="Your workouts are safe on this phone, but the database could not be opened. Try again; if it keeps failing, close and reopen the app."
          onRetry={retry}
        />
      )}
    >
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
        <Stack.Screen name="log" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </DatabaseProvider>
  );
}
