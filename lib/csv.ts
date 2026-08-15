function escapeField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds an RFC-4180-ish CSV string. Pure function: fields containing a
 * comma, double-quote, or newline are wrapped in double-quotes with inner
 * quotes doubled; null/undefined become empty strings; rows (including the
 * header row) are joined with CRLF ("\r\n"). No trailing line terminator.
 */
export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeField).join(","));
  return lines.join("\r\n");
}
