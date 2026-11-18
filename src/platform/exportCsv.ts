import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { csvFileName, entriesToCsv } from '@/lib/csv';
import type { DateString, Entry } from '@/lib/types';

/**
 * Writes every entry to a CSV in the cache folder and opens the iOS share sheet (Save to
 * Files, AirDrop, Mail...). This is the user's only backup, so any failure throws rather than
 * being swallowed; nothing in the database is touched either way.
 */
export async function exportCsv(entries: readonly Entry[], today: DateString): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  const file = new File(Paths.cache, csvFileName(today));
  file.create({ overwrite: true }); // a second export on the same day replaces the first
  await file.write(entriesToCsv(entries));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Export workouts',
  });
}
