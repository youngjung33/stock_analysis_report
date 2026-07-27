'use client';

import {
  DEFAULT_THEME,
  THEME_COOKIE_KEY,
  THEME_STORAGE_KEY,
  normalizeTheme,
  type ThemeMode,
} from '@sar/shared';

const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function readCookieTheme(): ThemeMode {
  if (typeof document === 'undefined') return DEFAULT_THEME;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${THEME_COOKIE_KEY}=([^;]+)`),
  );
  return normalizeTheme(match?.[1] ? decodeURIComponent(match[1]) : null);
}

function cacheTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function persistTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;
  document.cookie = `${THEME_COOKIE_KEY}=${theme};path=/;max-age=${THEME_COOKIE_MAX_AGE};SameSite=Lax`;
  cacheTheme(theme);
}

/** Dark = default (no class). Light = `.light` on <html>. */
export function applyThemeClass(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('light', theme === 'light');
}

/** Apply cookie theme and refresh the localStorage cache. */
export function syncThemeFromCookie(): ThemeMode {
  const theme = readCookieTheme();
  applyThemeClass(theme);
  cacheTheme(theme);
  return theme;
}

export function changeAppTheme(theme: ThemeMode): void {
  const normalized = normalizeTheme(theme);
  applyThemeClass(normalized);
  persistTheme(normalized);
}

export function getResolvedTheme(): ThemeMode {
  if (typeof document === 'undefined') return DEFAULT_THEME;
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}
