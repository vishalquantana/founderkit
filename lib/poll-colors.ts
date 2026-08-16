/** Distinct, brand-friendly colours for poll options, indexed by position. */
export const POLL_OPTION_COLORS = [
  "#8b5cf6", // violet
  "#f472b6", // pink
  "#60a5fa", // blue
  "#4ade80", // green
  "#f4c748", // gold
  "#fb923c", // orange
  "#22d3ee", // cyan
  "#a78bfa", // light violet
];

/** Colour for option index i (wraps if there are more options than colours). */
export function optionColor(i: number): string {
  return POLL_OPTION_COLORS[((i % POLL_OPTION_COLORS.length) + POLL_OPTION_COLORS.length) % POLL_OPTION_COLORS.length];
}
