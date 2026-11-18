import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ExerciseRow } from '@/components/ExerciseRow';
import { LoadingState } from '@/components/LoadingState';
import { SearchField } from '@/components/SearchField';
import { useExerciseList } from '@/hooks/useExercises';
import { useToday } from '@/hooks/useNow';
import { useTabBarClearance } from '@/hooks/useTabBarClearance';
import { encodeExerciseSlug } from '@/lib/exerciseRoute';
import { searchExercises } from '@/lib/exercises';
import { formatExerciseListCount } from '@/lib/format';
import { spacing, typography, useTheme } from '@/theme';

export default function ExercisesScreen() {
  const { colors } = useTheme();
  const clearance = useTabBarClearance();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const { exercises, loading, error, reload } = useExerciseList();
  const [query, setQuery] = useState('');

  const shown = searchExercises(exercises, query);

  const header = (
    <View>
      <Text
        accessibilityRole="header"
        style={[
          typography.screenTitle,
          styles.title,
          { color: colors.ink, paddingTop: insets.top + spacing.lg },
        ]}
      >
        exercises.
      </Text>
      <View style={styles.search}>
        <SearchField value={query} onChangeText={setQuery} />
      </View>
      {exercises.length > 0 ? (
        <Text style={[typography.eyebrow, styles.count, { color: colors.inkMuted }]}>
          {formatExerciseListCount(shown.length, exercises.length)}
        </Text>
      ) : null}
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingBottom: clearance }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      data={shown}
      keyExtractor={(item) => item.name.toLowerCase()}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <ExerciseRow
            exercise={item}
            today={today}
            onPress={() =>
              router.push({
                pathname: '/exercise/[name]',
                params: { name: encodeExerciseSlug(item.name) },
              })
            }
          />
        </View>
      )}
      ListEmptyComponent={
        loading ? (
          <LoadingState />
        ) : error ? (
          <View style={styles.row}>
            <EmptyState
              title="Couldn't load your exercises."
              message={error.message}
              actionLabel="Try again"
              onAction={reload}
            />
          </View>
        ) : exercises.length === 0 ? (
          <View style={styles.row}>
            <EmptyState
              icon="dumbbell"
              title="No exercises yet"
              message="Exercises appear here once you log them."
              actionLabel="Log an exercise"
              onAction={() => router.push('/log')}
            />
          </View>
        ) : (
          <View style={styles.row}>
            <EmptyState
              icon="search"
              title="No matches"
              message={`Nothing matches "${query.trim()}".`}
            />
          </View>
        )
      }
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  title: { textAlign: 'center', paddingBottom: spacing.lg },
  search: { marginHorizontal: spacing.screenX },
  count: { marginTop: 18, marginBottom: 10, marginHorizontal: spacing.xl },
  row: { paddingHorizontal: spacing.screenX },
  separator: { height: spacing.sm },
});
