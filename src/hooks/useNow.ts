import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { todayLocal } from '@/lib/dates';
import type { DateString } from '@/lib/types';

/**
 * The only place the device clock is read (ARCHITECTURE.md §8): everything else receives
 * "today" as a value. Refreshes every minute and when the app returns to the foreground, so
 * the day rolls over at midnight and after the phone has been asleep.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = setInterval(tick, intervalMs);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [intervalMs]);

  return now;
}

export function useToday(): DateString {
  return todayLocal(useNow());
}
