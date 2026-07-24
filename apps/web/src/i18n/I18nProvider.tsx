'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { usePathname } from 'next/navigation';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, normalizeLocale } from '@sar/shared';
import i18n, { changeAppLocale, getAppLocale } from './config';
import { pathnameToSeoRoute } from './seo-routes';
import { syncDocumentSeo } from './sync-document-seo';

interface Props {
  children: React.ReactNode;
}

function syncSeoForCurrentRoute(): void {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const route = pathnameToSeoRoute(pathname);
  syncDocumentSeo(getAppLocale(), route.pageKey, route.params);
}

/** Syncs html lang, locale storage/cookie, and document SEO on mount + language change */
export function I18nProvider({ children }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    const stored =
      typeof localStorage !== 'undefined'
        ? normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY))
        : DEFAULT_LOCALE;
    changeAppLocale(stored);
    syncSeoForCurrentRoute();

    const onLanguageChanged = () => syncSeoForCurrentRoute();
    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, []);

  useEffect(() => {
    const route = pathnameToSeoRoute(pathname ?? '/');
    syncDocumentSeo(getAppLocale(), route.pageKey, route.params);
  }, [pathname]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
