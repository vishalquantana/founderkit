export const THEME_STORAGE_KEY = "mrs-theme";
export const FONT_STORAGE_KEY = "mrs-fontpx";

export type Theme = "light" | "dark";

/**
 * Resolve the initial theme from a stored value. Light is the default;
 * only the exact string "dark" opts into the dark theme.
 */
export function resolveInitialTheme(stored: string | null): Theme {
  return stored === "dark" ? "dark" : "light";
}

/** Flip to the other theme. */
export function nextTheme(prev: Theme): Theme {
  return prev === "dark" ? "light" : "dark";
}
