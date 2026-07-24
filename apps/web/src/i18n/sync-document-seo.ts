import type { SupportedLocale } from '@sar/shared';
import type { SeoPageKey } from './seo-routes';
import { getPageSeoCopy } from './server-metadata';

function setMetaTag(name: string, content: string, useProperty = false): void {
  const attr = useProperty ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Client runtime — keep title, description, OG/Twitter in sync with locale + route */
export function syncDocumentSeo(
  locale: SupportedLocale,
  pageKey: SeoPageKey,
  params?: Record<string, string>,
): void {
  const { title, description } = getPageSeoCopy(locale, pageKey, params);
  const ogLocale = locale === 'ko' ? 'ko_KR' : 'en_US';

  document.documentElement.lang = locale;
  document.title = title;

  setMetaTag('description', description);
  setMetaTag('og:title', title, true);
  setMetaTag('og:description', description, true);
  setMetaTag('og:locale', ogLocale, true);
  setMetaTag('twitter:title', title);
  setMetaTag('twitter:description', description);
}
