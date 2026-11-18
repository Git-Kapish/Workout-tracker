import { addDays, diffDays } from './dates';
import type { DateString } from './types';
import { weekStart } from './weeks';

// The Week tab is a horizontal pager with one page per week. Pages are numbered from 0, and
// the page for the week that was current when the screen opened (the "anchor") is in the
// middle, so you can swipe about ten years either way.

export const PAGER_RADIUS = 520; // weeks each way
export const PAGER_CENTER = PAGER_RADIUS;
export const PAGER_COUNT = PAGER_RADIUS * 2 + 1;

/** [0, 1, ..., PAGER_COUNT - 1] */
export const PAGER_PAGES: readonly number[] = Array.from({ length: PAGER_COUNT }, (_, i) => i);

export function clampPage(page: number): number {
  return Math.min(PAGER_COUNT - 1, Math.max(0, page));
}

/** The Monday of the week shown on `page`. `anchor` is a Monday. */
export function weekStartForPage(anchor: DateString, page: number): DateString {
  return addDays(anchor, 7 * (page - PAGER_CENTER));
}

/** The page that shows the week containing `date`. */
export function pageForDate(anchor: DateString, date: DateString): number {
  return clampPage(PAGER_CENTER + Math.round(diffDays(weekStart(date), anchor) / 7));
}

/** A day on `page`: `weekday` is 0 (Monday) to 6 (Sunday). */
export function dateForPage(anchor: DateString, page: number, weekday: number): DateString {
  return addDays(weekStartForPage(anchor, page), weekday);
}

/** Which page a horizontal scroll offset is on (rounds to the nearest, so it flips at halfway). */
export function pageFromOffset(offsetX: number, pageWidth: number): number {
  if (!(pageWidth > 0) || !Number.isFinite(offsetX)) return PAGER_CENTER;
  return clampPage(Math.round(offsetX / pageWidth));
}
