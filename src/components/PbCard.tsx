import { StyleSheet, Text, View } from 'react-native';

import { radius, typography, useTheme } from '@/theme';

interface PbCardProps {
  /** Upper-case caption, e.g. 'MAX WEIGHT'. */
  label: string;
  /** Already formatted, e.g. '42.5 kg'; '—' when there is no record. */
  value: string;
}

export function PbCard({ label, value }: PbCardProps) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label.toLowerCase()}: ${value}`}
      style={[styles.card, { backgroundColor: colors.surface }]}
    >
      <Text style={[typography.eyebrow, styles.label, { color: colors.inkMuted }]}>{label}</Text>
      <Text style={[typography.statNumber, styles.value, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 16,
    borderRadius: radius.card,
  },
  label: { letterSpacing: 0.88 },
  value: { marginTop: 8, fontSize: 22, letterSpacing: -0.44 },
});
