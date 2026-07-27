export const THEME_MODES = ['light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const DEFAULT_THEME: ThemeMode = 'dark';

/** localStorage cache key (cookie is source of truth). */
export const THEME_STORAGE_KEY = 'sar_theme';

/** Cookie key — same value as storage key. */
export const THEME_COOKIE_KEY = THEME_STORAGE_KEY;

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function normalizeTheme(value: string | null | undefined): ThemeMode {
  return isThemeMode(value) ? value : DEFAULT_THEME;
}

export const THEME_LABELS: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
};
