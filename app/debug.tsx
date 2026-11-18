// TEMPORARY Phase 1 gate screen: proves inserts persist across app restarts and that
// subscribe() refreshes the list. DELETE this file (and the link on the Today tab,
// and the "debug" Stack.Screen in app/_layout.tsx) when Phase 1 is signed off.
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useRepository } from '@/hooks/useRepository';
import { todayLocal } from '@/lib/dates';
import { formatVolume, formatWeight } from '@/lib/format';
import { summarize } from '@/lib/metrics';
import type { Entry } from '@/lib/types';
import { radius, size, spacing, typography, useTheme } from '@/theme';

function DebugButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.button, { backgroundColor: colors.ink }]}
    >
      <Text style={[typography.rowTitle, { color: colors.surface }]}>{label}</Text>
    </Pressable>
  );
}

export default function DebugScreen() {
  const { colors } = useTheme();
  const repository = useRepository();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    repository.getAll().then(setEntries, (e: unknown) => setError(String(e)));
  }, [repository]);

  // Exercises subscribe(): every write below refreshes the list through this listener only.
  useEffect(() => {
    refresh();
    return repository.subscribe(refresh);
  }, [repository, refresh]);

  const run = (action: () => Promise<unknown>) => {
    setError(null);
    action().catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  };

  const addSample = () =>
    run(() =>
      repository.add({
        exerciseName: 'Debug Squat',
        sets: 3,
        reps: 5,
        weightKg: 62.5,
        date: todayLocal(new Date()),
      }),
    );

  const summary = summarize(entries);

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.content}
      accessibilityLabel="Debug screen"
    >
      <Text style={[typography.screenTitle, { color: colors.ink }]}>debug: database</Text>
      <Text style={[typography.body, { color: colors.inkMuted }]}>
        {summary.exerciseCount} entries · {summary.totalReps} reps ·{' '}
        {formatVolume(summary.totalVolumeKg)}
      </Text>
      {error ? <Text style={[typography.body, { color: colors.trendDownFg }]}>{error}</Text> : null}

      <DebugButton label="Add sample entry" onPress={addSample} />
      <DebugButton
        label="Delete newest entry"
        onPress={() => {
          const newest = entries[entries.length - 1];
          if (newest) run(() => repository.remove(newest.id));
        }}
      />
      <DebugButton label="Back" onPress={() => router.back()} />

      {entries.map((e) => (
        <Text key={e.id} style={[typography.body, { color: colors.ink }]}>
          #{e.id} {e.date} · {e.exerciseName} · {e.sets} × {e.reps}
          {e.weightKg === null ? ' · bodyweight' : ` · ${formatWeight(e.weightKg)}`}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenX,
    paddingTop: spacing.xl * 2,
    gap: spacing.md,
  },
  button: {
    height: size.pillButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
