export interface TabBox {
  name: string;
  x: number;
  width: number;
}

/** The tab whose centre is closest to a finger at `x` (capsule coordinates); null if none. */
export function nearestTab(boxes: readonly TabBox[], x: number): string | null {
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const box of boxes) {
    const distance = Math.abs(box.x + box.width / 2 - x);
    if (distance < bestDistance) {
      best = box.name;
      bestDistance = distance;
    }
  }
  return best;
}

/** Where the highlight sits while dragging: centred on the finger, but never past the first or last tab. */
export function highlightPosition(boxes: readonly TabBox[], x: number): number | null {
  const first = boxes[0];
  const last = boxes.at(-1);
  if (!first || !last) return null;
  return Math.min(Math.max(x - first.width / 2, first.x), last.x);
}
