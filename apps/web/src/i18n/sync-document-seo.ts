import type { SupportedLocale } from '@sar/shared';
import type { SeoPageKey } from './seo-routes';
import { getPageSeoCopy, translateSeo } from './server-metadata';

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

function setCanonicalLink(href: string): void {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setRobotsMeta(indexable: boolean): void {
  setMetaTag('robots', indexable ? 'index, follow' : 'noindex, follow');
}

/** Client runtime — keep title, description, OG/Twitter in sync with locale + route */
export function syncDocumentSeo(
  locale: SupportedLocale,
  pageKey: SeoPageKey,
  params?: Record<string, string>,
): void {
  const { title, description } = getPageSeoCopy(locale, pageKey, params);
  const siteName = translateSeo(locale, 'meta.siteName');
  const keywords = translateSeo(locale, 'meta.keywords');
  const ogLocale = locale === 'ko' ? 'ko_KR' : 'en_US';
  const alternateLocale = locale === 'ko' ? 'en_US' : 'ko_KR';
  const indexable = pageKey !== 'settings';

  document.documentElement.lang = locale;
  document.title = title;

  const pageUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0]! : '';
  const ogImage =
    typeof window !== 'undefined' ? `${window.location.origin}/opengraph-image` : '/opengraph-image';

  setMetaTag('description', description);
  setMetaTag('keywords', keywords);
  setMetaTag('application-name', siteName);
  setRobotsMeta(indexable);
  if (pageUrl) {
    setCanonicalLink(pageUrl);
  }

  setMetaTag('og:title', title, true);
  setMetaTag('og:description', description, true);
  setMetaTag('og:site_name', siteName, true);
  setMetaTag('og:locale', ogLocale, true);
  setMetaTag('og:locale:alternate', alternateLocale, true);
  if (pageUrl) {
    setMetaTag('og:url', pageUrl, true);
  }
  setMetaTag('og:image', ogImage, true);
  setMetaTag('twitter:card', 'summary_large_image');
  setMetaTag('twitter:title', title);
  setMetaTag('twitter:description', description);
  setMetaTag('twitter:image', ogImage);
}
