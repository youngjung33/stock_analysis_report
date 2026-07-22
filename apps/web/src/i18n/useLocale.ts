'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_LABELS, SUPPORTED_LOCALES, type SupportedLocale } from '@sar/shared';
import { changeAppLocale, getAppLocale } from './config';

export function useLocale() {
  const { t, i18n } = useTranslation();
  const locale = getAppLocale();

  const setLocale = useCallback((next: SupportedLocale) => {
    changeAppLocale(next);
  }, []);

  return {
    locale,
    setLocale,
    t,
    i18n,
    supportedLocales: SUPPORTED_LOCALES,
    localeLabels: LOCALE_LABELS,
  };
}
