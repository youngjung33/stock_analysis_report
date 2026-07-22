'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, normalizeLocale } from '@sar/shared';
import i18n, { changeAppLocale, getAppLocale } from './config';

interface Props {
  children: React.ReactNode;
}

function syncDocumentLocale() {
  const locale = getAppLocale();
  document.documentElement.lang = locale;
  document.title = i18n.t('meta.title');
}

/** Syncs html lang + stored locale on mount; wraps react-i18next provider */
export function I18nProvider({ children }: Props) {
  useEffect(() => {
    const stored =
      typeof localStorage !== 'undefined'
        ? normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY))
        : DEFAULT_LOCALE;
    changeAppLocale(stored);
    syncDocumentLocale();

    const onLanguageChanged = () => syncDocumentLocale();
    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
