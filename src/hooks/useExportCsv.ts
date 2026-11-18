import { useCallback, useRef, useState } from 'react';

import { exportCsv } from '@/platform/exportCsv';

import { useToday } from './useNow';
import { useRepository } from './useRepository';

/** 'shared' = the share sheet was shown; 'empty' = nothing logged yet; 'busy' = already running. */
export type ExportOutcome = 'shared' | 'empty' | 'failed' | 'busy';

export function useExportCsv() {
  const repository = useRepository();
  const today = useToday();
  const running = useRef(false);
  const [exporting, setExporting] = useState(false);

  const exportData = useCallback(async (): Promise<ExportOutcome> => {
    if (running.current) return 'busy';
    running.current = true;
    setExporting(true);
    try {
      const entries = await repository.getAll();
      if (entries.length === 0) return 'empty';
      await exportCsv(entries, today);
      return 'shared';
    } catch (error) {
      console.error('CSV export failed', error);
      return 'failed';
    } finally {
      running.current = false;
      setExporting(false);
    }
  }, [repository, today]);

  return { exporting, exportData };
}
