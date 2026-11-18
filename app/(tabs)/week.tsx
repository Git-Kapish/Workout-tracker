import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { WeekNavigator } from '@/components/WeekNavigator';
import { WeekDetail } from '@/components/WeekDetail';
import { WeekStripPage } from '@/components/WeekStripPage';
import { useTabBarClearance } from '@/hooks/useTabBarClearance';
import { haptics } from '@/platform/haptics';
import { useToday } from '@/hooks/useNow';
import { weekdayIndex } from '@/lib/dates';
import { formatWeekRelative } from '@/lib/format';
import type { DateString } from '@/lib/types';
import {
  PAGER_PAGES,
  clampPage,
  pageForDate,
  pageFromOffset,
  weekStartForPage,
} from '@/lib/weekPager';
import { formatWeekLabel, weekStart } from '@/lib/weeks';
import { size, spacing, useTheme } from '@/theme';

/**
 * Week tab: the row of days is a horizontal pager with one page per week. Swipe that row to move
 * between weeks (native paging: momentum, snapping, rubber-banding, the neighbouring week
 * sliding in under your finger), or use the arrows. The entries and totals below stay in place
 * and follow the week. Moving a week keeps the weekday (Tuesday -> next Tuesday).
 */
export default function WeekScreen() {
  const { colors } = useTheme();
  const today = useToday();
  const bottomInset = useTabBarClearance();
  // Page numbers are relative to the week that was current when the tab first opened.
  const [anchor] = useState<DateString>(() => weekStart(today));
  const todayPage = pageForDate(anchor, today);
  const [page, setPage] = useState(todayPage);
  const [weekday, setWeekday] = useState(() => weekdayIndex(today));
  const [width, setWidth] = useState<number | null>(null);
  const listRef = useRef<FlatList<number>>(null);

  const start = weekStartForPage(anchor, page);

  const goToPage = useCallback((next: number) => {
    const target = clampPage(next);
    setPage(target);
    listRef.current?.scrollToIndex({ index: target, animated: true });
  }, []);

  // A threshold, not a per-frame update: state only changes when a swipe passes halfway to
  // the next week, so the header label follows the finger without re-rendering every frame.
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!width) return;
      const next = pageFromOffset(event.nativeEvent.contentOffset.x, width);
      if (next === page) return;
      haptics.selection(); // one tick per week passed
      setPage(next);
    },
    [width, page],
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth((current) => (current === next ? current : next));
  }, []);

  const jumpToToday = () => {
    setWeekday(weekdayIndex(today));
    goToPage(todayPage);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <WeekNavigator
        label={formatWeekLabel(start)}
        caption={formatWeekRelative(start, today)}
        isCurrentWeek={page === todayPage}
        onPrevious={() => goToPage(page - 1)}
        onNext={() => goToPage(page + 1)}
        onJumpToToday={jumpToToday}
      />

      {/* Only this row scrolls sideways; what is under it stays put. */}
      <View testID="week-pager-box" style={styles.pager} onLayout={onLayout}>
        {width ? (
          <FlatList
            ref={listRef}
            testID="week-pager"
            horizontal
            pagingEnabled
            data={PAGER_PAGES}
            extraData={`${weekday}|${today}`}
            keyExtractor={(index) => String(index)}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            initialScrollIndex={todayPage}
            initialNumToRender={1}
            windowSize={3}
            maxToRenderPerBatch={1}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScroll={onScroll}
            renderItem={({ item }) => (
              <WeekStripPage
                weekStartDate={weekStartForPage(anchor, item)}
                weekday={weekday}
                today={today}
                width={width}
                onSelectWeekday={setWeekday}
              />
            )}
          />
        ) : null}
      </View>

      <WeekDetail
        weekStartDate={start}
        weekday={weekday}
        today={today}
        bottomInset={bottomInset}
        onOpenEntry={(id) => router.push(`/log?id=${id}`)}
        onLogOnDay={(date) => router.push(`/log?date=${date}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // A horizontal list has no height of its own, so the row's height is given here.
  pager: { height: size.dayCellH, marginTop: spacing.lg },
});
