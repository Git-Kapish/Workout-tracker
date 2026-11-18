import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { exportCsv } from '@/platform/exportCsv';
import type { Entry } from '@/lib/types';

const created: { dir: string; name: string; options?: unknown; written: string[] }[] = [];

jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  File: jest.fn().mockImplementation((dir: string, name: string) => {
    const record = { dir, name, options: undefined as unknown, written: [] as string[] };
    created.push(record);
    return {
      uri: `${dir}/${name}`,
      create: (options?: unknown) => {
        record.options = options;
      },
      write: async (text: string) => {
        record.written.push(text);
      },
    };
  }),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

const entries: Entry[] = [
  { id: 1, exerciseName: 'Press, overhead', sets: 3, reps: 8, weightKg: 30, date: '2026-11-12' },
  { id: 2, exerciseName: 'Pull-ups', sets: 3, reps: 6, weightKg: null, date: '2026-11-17' },
];

beforeEach(() => {
  created.length = 0;
  jest.clearAllMocks();
  jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(true);
  jest.mocked(Sharing.shareAsync).mockResolvedValue(undefined);
});

describe('exportCsv', () => {
  it('writes the CSV to a dated .csv file in the cache folder and shares that file', async () => {
    await exportCsv(entries, '2026-11-17');

    expect(File).toHaveBeenCalledWith('file:///cache', 'tally-export-2026-11-17.csv');
    expect(created[0]?.options).toEqual({ overwrite: true });
    const text = created[0]?.written[0] ?? '';
    expect(text.startsWith('﻿date,exercise,sets,reps,weight_kg\r\n')).toBe(true);
    expect(text).toContain('2026-11-12,"Press, overhead",3,8,30\r\n');
    expect(text).toContain('2026-11-17,Pull-ups,3,6,\r\n');

    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/tally-export-2026-11-17.csv', {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: 'Export workouts',
    });
  });

  it('shares only after the file has been written', async () => {
    const order: string[] = [];
    jest.mocked(File).mockImplementationOnce(
      () =>
        ({
          uri: 'file:///cache/x.csv',
          create: () => order.push('create'),
          write: async () => {
            order.push('write');
          },
        }) as unknown as File,
    );
    jest.mocked(Sharing.shareAsync).mockImplementation(async () => {
      order.push('share');
    });
    await exportCsv(entries, '2026-11-17');
    expect(order).toEqual(['create', 'write', 'share']);
  });

  it('throws, without writing anything, when sharing is unavailable', async () => {
    jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(false);
    await expect(exportCsv(entries, '2026-11-17')).rejects.toThrow('not available');
    expect(created).toHaveLength(0);
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it('propagates a share failure instead of hiding it', async () => {
    jest.mocked(Sharing.shareAsync).mockRejectedValue(new Error('share failed'));
    await expect(exportCsv(entries, '2026-11-17')).rejects.toThrow('share failed');
  });
});
