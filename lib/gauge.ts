/** Clamp a 0..100 score to a percentage (0..100), integer. */
export function gaugePercent(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
