import { memo } from 'react';
import { View } from 'react-native';

import { useWeek } from '@/hooks/useWeek';
import type { DateString } from '@/lib/types';

import { DayStrip } from './DayStrip';

interface WeekStripPageProps {
  /** The Monday of the week this page shows. */
  weekStartDate: DateString;
  /** 0 (Monday) to 6 (Sunday): the same weekday stays highlighted on every page while swiping. */
  weekday: number;
  today: DateString;
  width: number;
  onSelectWeekday: (weekday: number) => void;
}

/**
 * One page of the swipeable day row on the Week tab. It loads its own week so the dots under
 * neighbouring weeks are already there when you swipe to them.
 */
export const WeekStripPage = memo(function WeekStripPage({
  weekStartDate,
  weekday,
  today,
  width,
  onSelectWeekday,
}: WeekStripPageProps) {
  const week = useWeek(weekStartDate);
  const selected = week.days[weekday]?.date ?? weekStartDate;

  return (
    <View style={{ width }}>
      <DayStrip
        days={week.days}
        today={today}
        selected={selected}
        onSelect={(date) => onSelectWeekday(week.days.findIndex((d) => d.date === date))}
      />
    </View>
  );
});
