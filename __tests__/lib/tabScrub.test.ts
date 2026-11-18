import { highlightPosition, nearestTab, type TabBox } from '@/lib/tabScrub';

// Four equal tabs with the centre "+" gap between the second and third.
const BOXES: TabBox[] = [
  { name: 'index', x: 8, width: 80 },
  { name: 'week', x: 88, width: 80 },
  { name: 'progress', x: 250, width: 80 },
  { name: 'exercises', x: 330, width: 80 },
];

describe('nearestTab', () => {
  it('picks the tab whose centre is closest to the finger', () => {
    expect(nearestTab(BOXES, 50)).toBe('index');
    expect(nearestTab(BOXES, 130)).toBe('week');
    expect(nearestTab(BOXES, 295)).toBe('progress');
    expect(nearestTab(BOXES, 380)).toBe('exercises');
  });

  it('maps the gap under the + button to the nearer neighbour', () => {
    expect(nearestTab(BOXES, 190)).toBe('week'); // centre 128 is 62 away, progress 290 is 100
    expect(nearestTab(BOXES, 240)).toBe('progress');
  });

  it('clamps to the first and last tab when the finger leaves either end', () => {
    expect(nearestTab(BOXES, -200)).toBe('index');
    expect(nearestTab(BOXES, 900)).toBe('exercises');
  });

  it('returns null when nothing has been measured yet', () => {
    expect(nearestTab([], 100)).toBeNull();
  });
});

describe('highlightPosition', () => {
  it('centres the highlight on the finger', () => {
    expect(highlightPosition(BOXES, 200)).toBe(160);
  });

  it('never goes past the first or the last tab', () => {
    expect(highlightPosition(BOXES, -50)).toBe(8);
    expect(highlightPosition(BOXES, 1000)).toBe(330);
  });

  it('returns null with no tabs', () => {
    expect(highlightPosition([], 10)).toBeNull();
  });
});
