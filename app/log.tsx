import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryForm } from '@/components/EntryForm';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { useEntriesForDate, useEntry } from '@/hooks/queries';
import { useEntryForm } from '@/hooks/useEntryForm';
import { useToday } from '@/hooks/useNow';
import { isValidDateString } from '@/lib/dates';
import { formatExerciseCount, formatMonthDay, formatWeekdayLong } from '@/lib/format';
import type { DateString, Entry } from '@/lib/types';
import { radius, spacing, typography, useTheme } from '@/theme';

// Height reserved at the top for the weekday / date / count. The sheet starts below it and is
// capped to the rest, so a tall sheet (the Edit form has a Delete button, large text grows it)
// can never cover the date.
const HEADER_ZONE = 150;

/**
 * Add / edit sheet (DESIGN.md screen 3). `/log` adds, `/log?id=12` edits, and `/log?date=…`
 * adds on a given day.
 */
export default function LogScreen() {
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const today = useToday();
  const { colors } = useTheme();
  const close = () => router.back();

  const entryId = params.id !== undefined && /^\d+$/.test(params.id) ? Number(params.id) : null;
  const wantsEdit = params.id !== undefined;
  const entry = useEntry(entryId);

  if (wantsEdit) {
    if (entry.loading) {
      return (
        <View style={[styles.fill, styles.missing, { backgroundColor: colors.bg }]}>
          <LoadingState />
        </View>
      );
    }
    if (!entry.data) {
      return (
        <View style={[styles.fill, styles.missing, { backgroundColor: colors.bg }]}>
          <EmptyState title="This entry no longer exists." actionLabel="Close" onAction={close} />
        </View>
      );
    }
  }

  const initialDate: DateString =
    params.date !== undefined && isValidDateString(params.date) ? params.date : today;
  // key: re-initialise the form if the sheet is reused for a different entry.
  return (
    <LogSheet
      key={entry.data?.id ?? 'new'}
      entry={entry.data ?? undefined}
      initialDate={initialDate}
      today={today}
      onClose={close}
    />
  );
}

function LogSheet({
  entry,
  initialDate,
  today,
  onClose,
}: {
  entry?: Entry;
  initialDate: DateString;
  today: DateString;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const form = useEntryForm({
    entry,
    initialDate,
    // Adding keeps the sheet open for the next exercise (FR-10); editing is one-and-done.
    onSaved: entry ? onClose : undefined,
    onDeleted: onClose,
  });
  const day = useEntriesForDate(form.fields.date);
  const count = day.data?.length ?? 0;
  const date = form.fields.date;

  return (
    <View style={styles.fill}>
      <LinearGradient
        colors={[...colors.sheetBackdrop]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View testID="log-header" style={styles.backdropText} pointerEvents="none">
        <Text style={[typography.eyebrow, { color: colors.inkSoft }]}>
          {formatWeekdayLong(date).toUpperCase()}
        </Text>
        <Text maxFontSizeMultiplier={1.2} style={[typography.display, { color: colors.ink }]}>
          {formatMonthDay(date)}
        </Text>
        <Text style={[typography.body, { color: colors.inkSoft, fontWeight: '400' }]}>
          {day.data ? `${formatExerciseCount(count)} logged${date === today ? ' today' : ''}` : ' '}
        </Text>
      </View>

      <View testID="log-sheet-zone" style={styles.sheetZone}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View
            testID="log-sheet"
            style={[styles.sheet, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.sheetContent,
                { paddingBottom: insets.bottom + spacing.xl },
              ]}
            >
              <EntryForm form={form} today={today} onClose={onClose} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  missing: { justifyContent: 'center', padding: spacing.screenX },
  backdropText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_ZONE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  sheetZone: { flex: 1, paddingTop: HEADER_ZONE },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '100%',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    shadowOffset: { width: 0, height: -10 },
    shadowRadius: 40,
    shadowOpacity: 1,
  },
  sheetContent: { padding: spacing.xl, paddingBottom: spacing.xl },
});
