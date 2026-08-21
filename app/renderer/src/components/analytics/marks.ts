/**
 * Shared mark styling for the analytics charts.
 *
 * The app has no chromatic brand accent, so every chart is a single sequential
 * series in the foreground ink. The fill is lifted slightly off `--fg-1` so a
 * dozen columns don't read as a wall of solid black; the hovered mark goes to
 * full ink, which doubles as the hover affordance. Both sides of the mix are
 * tokens, so light and dark mode each get their own hand-picked values.
 */
export const BAR_FILL = 'color-mix(in srgb, var(--fg-1) 78%, var(--page))';
export const BAR_FILL_ACTIVE = 'var(--fg-1)';

/** Column outline: 4px rounded data-end, square where it meets the baseline. */
export function columnPath(x: number, y: number, w: number, h: number, r = 4): string {
  const radius = Math.max(0, Math.min(r, w / 2, h));
  return [
    `M${x} ${y + h}`,
    `L${x} ${y + radius}`,
    `Q${x} ${y} ${x + radius} ${y}`,
    `L${x + w - radius} ${y}`,
    `Q${x + w} ${y} ${x + w} ${y + radius}`,
    `L${x + w} ${y + h}`,
    'Z',
  ].join(' ');
}

export function clamp(v: number, min: number, max: number): number {
  if (max < min) return (min + max) / 2;
  return Math.min(Math.max(v, min), max);
}
