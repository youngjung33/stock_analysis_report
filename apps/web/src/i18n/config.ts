'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  type SupportedLocale,
} from '@sar/shared';
import en from './locales/en.json';
import ko from './locales/ko.json';

function readStoredLocale(): SupportedLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  return normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
  lng: readStoredLocale(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export function changeAppLocale(locale: SupportedLocale): void {
  void i18n.changeLanguage(locale);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }
}

export function getAppLocale(): SupportedLocale {
  return normalizeLocale(i18n.language);
}

export default i18n;
