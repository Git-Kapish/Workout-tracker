import { Alert, Pressable, StyleSheet } from 'react-native';

import { useExportCsv } from '@/hooks/useExportCsv';
import { radius, size, useTheme } from '@/theme';

import { Icon } from './Icon';

/** Round button in the Today header: exports all data as a CSV (the app's only backup). */
export function ExportButton() {
  const { colors } = useTheme();
  const { exporting, exportData } = useExportCsv();

  const onPress = async () => {
    const outcome = await exportData();
    if (outcome === 'empty') {
      Alert.alert('Nothing to export yet', 'Log a workout first, then export it as a backup.');
    } else if (outcome === 'failed') {
      Alert.alert("Couldn't export", 'Your data is safe and untouched. Please try again.');
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Export data as CSV"
      accessibilityState={{ disabled: exporting, busy: exporting }}
      disabled={exporting}
      onPress={() => void onPress()}
      style={[styles.button, { backgroundColor: colors.surface, opacity: exporting ? 0.5 : 1 }]}
    >
      <Icon name="download" color={colors.ink} size={20} strokeWidth={1.9} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: size.closeButton,
    height: size.closeButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
