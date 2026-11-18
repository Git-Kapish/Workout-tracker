import { StyleSheet, Text, View } from 'react-native';

import { size, spacing, typography, useTheme } from '@/theme';

import { PillButton } from './PillButton';

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry: () => void;
}

/**
 * Full-screen friendly failure screen (root error boundary and a failed database open).
 * It deliberately never shows the underlying exception: that goes to the dev console.
 */
export function ErrorFallback({
  title = 'Something went wrong',
  message = 'Your workouts are safe: they are stored on this phone and nothing was lost. Try again, and if it keeps happening, close and reopen the app.',
  onRetry,
}: ErrorFallbackProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]} accessibilityRole="alert">
      <Text accessibilityRole="header" style={[typography.sheetTitle, { color: colors.ink }]}>
        {title}
      </Text>
      <Text
        style={[typography.body, styles.message, { color: colors.inkMuted, fontWeight: '400' }]}
      >
        {message}
      </Text>
      <PillButton label="Try again" onPress={onRetry} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: spacing.screenX,
    justifyContent: 'center',
    gap: spacing.md,
  },
  message: { fontSize: 15, lineHeight: 22 },
  button: { marginTop: spacing.lg, minHeight: size.pillButton },
});
