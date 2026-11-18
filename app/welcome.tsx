import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PillButton } from '@/components/PillButton';
import { GradientWord, WelcomeArt } from '@/components/WelcomeArt';
import { useWelcome } from '@/hooks/useWelcome';
import { spacing, typography } from '@/theme';
import { lightPalette } from '@/theme/colors';
import { welcome } from '@/theme/welcome';

// First-launch splash (DESIGN.md screen 1). There is no sign-in because the app has no
// accounts. Always light: the design is a fixed pastel scene.
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { markSeen } = useWelcome();
  const [busy, setBusy] = useState(false);
  const colors = lightPalette;

  const getStarted = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await markSeen();
    } catch (e) {
      // Not worth blocking the user: they still get into the app, and the welcome
      // screen would just show once more next launch.
      console.error('Could not save the welcome flag', e);
    }
    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...welcome.background]}
        locations={[...welcome.backgroundStops]}
        style={StyleSheet.absoluteFill}
      />
      <WelcomeArt />
      <View style={[styles.copy, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={[styles.wordmark, { color: colors.inkMuted }]}>tally</Text>
        <Text
          accessibilityRole="header"
          style={[typography.display, styles.headline, { color: colors.ink }]}
        >
          Every rep,
        </Text>
        <GradientWord text="counted." fontSize={36} />
        <Text style={[styles.subtitle, { color: colors.inkMuted }]}>
          Log sets, reps and weight. See this week beat last week.
        </Text>
        <PillButton
          label="Get started"
          onPress={() => void getStarted()}
          disabled={busy}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  copy: { paddingHorizontal: spacing.xl, alignItems: 'center' },
  wordmark: { fontSize: 24, fontWeight: '600', letterSpacing: -0.48 },
  headline: { marginTop: 14, lineHeight: 40 },
  subtitle: {
    marginTop: spacing.md,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 280,
    textAlign: 'center',
  },
  button: { marginTop: 28, width: '100%' },
});
