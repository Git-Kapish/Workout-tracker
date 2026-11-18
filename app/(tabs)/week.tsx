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
import { WeekPage } from '@/components/WeekPage';
import { useTabBarClearance } from '@/hooks/useTabBarClearance';
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
import { useTheme } from '@/theme';

/**
 * Week tab: a horizontal pager with one page per week. Swipe to move between weeks (native
 * paging: momentum, snapping and rubber-banding at the ends, with the neighbouring week
 * sliding in under your finger), or use the arrows. Moving a week keeps the weekday
 * (Tuesday -> next Tuesday).
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
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
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
      if (!box) return;
      const next = pageFromOffset(event.nativeEvent.contentOffset.x, box.width);
      setPage((current) => (current === next ? current : next));
    },
    [box],
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((current) =>
      current && current.width === width && current.height === height ? current : { width, height },
    );
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

      <View testID="week-pager-box" style={styles.pager} onLayout={onLayout}>
        {box ? (
          <FlatList
            ref={listRef}
            testID="week-pager"
            horizontal
            pagingEnabled
            data={PAGER_PAGES}
            extraData={`${weekday}|${today}|${box.height}|${bottomInset}`}
            keyExtractor={(index) => String(index)}
            getItemLayout={(_, index) => ({ length: box.width, offset: box.width * index, index })}
            initialScrollIndex={todayPage}
            initialNumToRender={1}
            windowSize={3}
            maxToRenderPerBatch={1}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScroll={onScroll}
            renderItem={({ item }) => (
              <WeekPage
                weekStartDate={weekStartForPage(anchor, item)}
                weekday={weekday}
                today={today}
                width={box.width}
                height={box.height}
                bottomInset={bottomInset}
                onSelectWeekday={setWeekday}
                onOpenEntry={(id) => router.push(`/log?id=${id}`)}
                onLogOnDay={(date) => router.push(`/log?date=${date}`)}
              />
            )}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pager: { flex: 1 },
});
