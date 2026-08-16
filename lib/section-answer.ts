/**
 * Combine a selected chip label (single-select) with the founder's free-text
 * detail into the one `mainAnswer` string we persist per section.
 */
export function composeSectionAnswer(chipLabel: string | null, detail: string): string {
  const d = detail.trim();
  if (chipLabel && d) return `${chipLabel} — ${d}`;
  if (chipLabel) return chipLabel;
  return d;
}
