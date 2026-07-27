import {
  DEFAULT_THEME,
  THEME_COOKIE_KEY,
  normalizeTheme,
  type ThemeMode,
} from '@sar/shared';

type CookieStore = {
  get: (name: string) => { value: string } | undefined;
};

export function getServerTheme(cookieStore: CookieStore): ThemeMode {
  return normalizeTheme(cookieStore.get(THEME_COOKIE_KEY)?.value ?? DEFAULT_THEME);
}

/** Dark is default (no class). Light adds `light` to <html>. */
export function themeHtmlClass(theme: ThemeMode): string | undefined {
  return theme === 'light' ? 'light' : undefined;
}
