'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { usePathname } from 'next/navigation';
import { normalizeLocale, type SupportedLocale } from '@sar/shared';
import i18n, { getAppLocale, syncI18nLocale, syncLocaleFromCookie } from './config';
import { pathnameToSeoRoute } from './seo-routes';
import { syncDocumentSeo } from './sync-document-seo';

interface Props {
  children: React.ReactNode;
  initialLocale: SupportedLocale;
}

function syncSeoForCurrentRoute(): void {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const route = pathnameToSeoRoute(pathname);
  syncDocumentSeo(getAppLocale(), route.pageKey, route.params);
}

/** Syncs html lang, locale storage/cookie, and document SEO on mount + language change */
export function I18nProvider({ children, initialLocale }: Props) {
  const pathname = usePathname();
  const serverLocale = normalizeLocale(initialLocale);

  syncI18nLocale(serverLocale);

  useEffect(() => {
    syncLocaleFromCookie();
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
