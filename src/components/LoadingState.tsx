import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '@/theme';

interface LoadingStateProps {
  /**
   * Local SQLite answers in a few milliseconds, so a spinner shown immediately would just
   * flash. It only appears if loading takes longer than this.
   */
  delayMs?: number;
}

export function LoadingState({ delayMs = 250 }: LoadingStateProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(delayMs <= 0);

  useEffect(() => {
    if (delayMs <= 0) return;
    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!visible) return null;
  return (
    <View
      style={styles.box}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <ActivityIndicator color={colors.inkMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
