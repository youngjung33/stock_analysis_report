'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  type SupportedLocale,
} from '@sar/shared';
import { localeBundles } from './locale-bundles';

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: localeBundles.en },
    ko: { translation: localeBundles.ko },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

/** Read locale from the cookie (client source of truth). */
export function readCookieLocale(): SupportedLocale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE_KEY}=([^;]+)`),
  );
  return normalizeLocale(match?.[1] ? decodeURIComponent(match[1]) : null);
}

/** Align i18n with server/cookie locale before render — do not persist. */
export function syncI18nLocale(locale: SupportedLocale): void {
  const normalized = normalizeLocale(locale);
  if (normalizeLocale(i18n.language) !== normalized) {
    i18n.language = normalized;
  }
}

function cacheLocale(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

function persistLocale(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE_KEY}=${locale};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};SameSite=Lax`;
  cacheLocale(locale);
  document.documentElement.lang = locale;
}

/** Apply cookie locale to i18n and refresh the localStorage cache. */
export function syncLocaleFromCookie(): SupportedLocale {
  const locale = readCookieLocale();
  syncI18nLocale(locale);
  cacheLocale(locale);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
  return locale;
}

export function changeAppLocale(locale: SupportedLocale): void {
  const normalized = normalizeLocale(locale);
  void i18n.changeLanguage(normalized);
  persistLocale(normalized);
}

export function getAppLocale(): SupportedLocale {
  return normalizeLocale(i18n.language);
}

export default i18n;
