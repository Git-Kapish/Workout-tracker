import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { HistoryRow } from '@/components/HistoryRow';
import { LoadingState } from '@/components/LoadingState';
import { PbCard } from '@/components/PbCard';
import { RoundButton } from '@/components/RoundButton';
import { WeightLineChart } from '@/components/WeightLineChart';
import { useExerciseHistory } from '@/hooks/useExercises';
import { useToday } from '@/hooks/useNow';
import { decodeExerciseSlug } from '@/lib/exerciseRoute';
import { formatPersonalBests } from '@/lib/format';
import { spacing, typography, useTheme } from '@/theme';

// Reached from the Exercises list. The route lives inside the tabs (hidden from the bar) so
// the tab bar stays visible with "Exercises" active, as in the design.
export default function ExerciseDetailRoute() {
  const { name: slug } = useLocalSearchParams<{ name?: string }>();
  const name = slug ? decodeExerciseSlug(slug) : null;
  return name === null ? <NotFound /> : <ExerciseDetail name={name} />;
}

const goBack = () => router.navigate('/exercises');

function Header({ title }: { title: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <RoundButton icon="chevronLeft" label="Back to exercises" onPress={goBack} />
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={[typography.screenTitle, styles.title, { color: colors.ink }]}
      >
        {title}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
}

function NotFound() {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header title="" />
      <View style={styles.padded}>
        <EmptyState title="Exercise not found" actionLabel="Back to exercises" onAction={goBack} />
      </View>
    </View>
  );
}

function ExerciseDetail({ name }: { name: string }) {
  const { colors } = useTheme();
  const today = useToday();
  const history = useExerciseHistory(name);
  const bests = formatPersonalBests(history.bests);

  const top = (
    <View>
      <View style={styles.pbRow}>
        <PbCard label="MAX WEIGHT" value={bests.maxWeight} />
        <PbCard label="BEST VOLUME" value={bests.bestVolume} />
        <PbCard label="MAX REPS/SET" value={bests.maxReps} />
      </View>
      <View style={styles.chart}>
        <WeightLineChart name={history.displayName} series={history.series} />
      </View>
      <Text style={[typography.eyebrow, styles.eyebrow, { color: colors.inkMuted }]}>HISTORY</Text>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header title={history.displayName} />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={history.entries}
        keyExtractor={(entry) => String(entry.id)}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={history.loading ? undefined : top}
        renderItem={({ item }) => (
          <HistoryRow
            entry={item}
            today={today}
            onPress={() => router.push(`/log?id=${item.id}`)}
          />
        )}
        ListEmptyComponent={
          history.loading ? (
            <LoadingState />
          ) : history.error ? (
            <EmptyState
              title="Couldn't load this exercise."
              message={history.error.message}
              actionLabel="Try again"
              onAction={history.reload}
            />
          ) : (
            <EmptyState
              title="No entries for this exercise"
              message="It may have been deleted."
              actionLabel="Back to exercises"
              onAction={goBack}
            />
          )
        }
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  padded: { paddingHorizontal: spacing.screenX },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenX,
    paddingBottom: spacing.md,
  },
  title: { flex: 1, textAlign: 'center' },
  spacer: { width: 44 },
  listContent: { paddingHorizontal: spacing.screenX, paddingBottom: spacing.xl },
  pbRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  chart: { marginTop: spacing.md },
  eyebrow: { marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs + 2 },
  separator: { height: 6 },
});
