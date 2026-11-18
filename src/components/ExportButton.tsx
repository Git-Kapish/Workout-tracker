import { Alert } from 'react-native';

import { useExportCsv } from '@/hooks/useExportCsv';

import { RoundButton } from './RoundButton';

/** Runs the CSV export and tells the user plainly if there was nothing to export or it failed. */
export function useExportAction() {
  const { exporting, exportData } = useExportCsv();

  const run = async () => {
    const outcome = await exportData();
    if (outcome === 'empty') {
      Alert.alert('Nothing to export yet', 'Log a workout first, then export it as a backup.');
    } else if (outcome === 'failed') {
      Alert.alert("Couldn't export", 'Your data is safe and untouched. Please try again.');
    }
  };

  return { exporting, run };
}

/** Glass button in the Today header: exports all data as a CSV (the app's only backup). */
export function ExportButton() {
  const { exporting, run } = useExportAction();
  return (
    <RoundButton
      icon="download"
      label="Export data as CSV"
      disabled={exporting}
      busy={exporting}
      onPress={() => void run()}
    />
  );
}
