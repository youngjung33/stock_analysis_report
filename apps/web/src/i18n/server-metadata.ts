import type { Metadata } from 'next';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  normalizeLocale,
  type SupportedLocale,
} from '@sar/shared';
import en from './locales/en.json';
import ko from './locales/ko.json';
import { seoPathForPageKey, type SeoPageKey } from './seo-routes';

type LocaleBundle = typeof en;

const BUNDLES: Record<SupportedLocale, LocaleBundle> = { en, ko };

type CookieStore = {
  get: (name: string) => { value: string } | undefined;
};

export function getSiteUrl(): string {
  const fromEnv =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  return fromEnv || 'http://localhost:3000';
}

export function getServerLocale(cookieStore: CookieStore): SupportedLocale {
  return normalizeLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
}

function getNestedString(obj: LocaleBundle, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
  return typeof value === 'string' ? value : undefined;
}

function interpolate(template: string, params?: Record<string, string>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => params[key] ?? '');
}

export function translateSeo(
  locale: SupportedLocale,
  key: string,
  params?: Record<string, string>,
): string {
  const bundle = BUNDLES[locale] ?? BUNDLES[DEFAULT_LOCALE];
  const fallback = BUNDLES[DEFAULT_LOCALE];
  const raw = getNestedString(bundle, key) ?? getNestedString(fallback, key) ?? key;
  return interpolate(raw, params);
}

export interface PageSeoCopy {
  title: string;
  description: string;
}

export function getPageSeoCopy(
  locale: SupportedLocale,
  pageKey: SeoPageKey,
  params?: Record<string, string>,
): PageSeoCopy {
  const siteName = translateSeo(locale, 'meta.siteName');
  const defaultTitle = translateSeo(locale, 'meta.title');
  const defaultDescription = translateSeo(locale, 'meta.description');

  if (pageKey === 'home') {
    return {
      title: translateSeo(locale, 'seo.pages.home.title') || defaultTitle,
      description: translateSeo(locale, 'seo.pages.home.description') || defaultDescription,
    };
  }

  const pageTitle = translateSeo(locale, `seo.pages.${pageKey}.title`, params);
  const pageDescription =
    translateSeo(locale, `seo.pages.${pageKey}.description`, params) || defaultDescription;

  return {
    title: `${pageTitle} · ${siteName}`,
    description: pageDescription,
  };
}

export function buildPageMetadata(
  locale: SupportedLocale,
  pageKey: SeoPageKey,
  params?: Record<string, string>,
): Metadata {
  const siteName = translateSeo(locale, 'meta.siteName');
  const keywords = translateSeo(locale, 'meta.keywords');
  const { title, description } = getPageSeoCopy(locale, pageKey, params);
  const siteUrl = getSiteUrl();
  const pathname = seoPathForPageKey(pageKey, params);
  const pageUrl = new URL(pathname, siteUrl).toString();
  const ogLocale = locale === 'ko' ? 'ko_KR' : 'en_US';
  const ogImageAlt = translateSeo(locale, 'meta.ogImageAlt');
  const ogImage = {
    url: '/opengraph-image',
    width: 1200,
    height: 630,
    alt: ogImageAlt,
  };
  const indexable = pageKey !== 'settings';

  return {
    metadataBase: new URL(siteUrl),
    title: pageKey === 'home' ? title : { absolute: title },
    description,
    applicationName: siteName,
    keywords,
    alternates: {
      canonical: pageUrl,
    },
    icons: {
      icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/apple-icon', type: 'image/png', sizes: '180x180' }],
    },
    openGraph: {
      type: 'website',
      locale: ogLocale,
      alternateLocale: locale === 'ko' ? ['en_US'] : ['ko_KR'],
      siteName,
      title,
      description,
      url: pageUrl,
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage.url],
    },
    robots: {
      index: indexable,
      follow: true,
    },
  };
}

export async function generateMetadataFromCookies(
  cookieStore: CookieStore,
  pageKey: SeoPageKey,
  params?: Record<string, string>,
): Promise<Metadata> {
  const locale = getServerLocale(cookieStore);
  return buildPageMetadata(locale, pageKey, params);
}

export interface OgImageCopy {
  siteName: string;
  tagline: string;
  features: string;
  badge: string;
  alt: string;
}

export function getOgImageCopy(locale: SupportedLocale): OgImageCopy {
  return {
    siteName: translateSeo(locale, 'meta.siteName'),
    tagline: translateSeo(locale, 'meta.ogImageTagline'),
    features: translateSeo(locale, 'meta.ogImageFeatures'),
    badge: translateSeo(locale, 'meta.ogImageBadge'),
    alt: translateSeo(locale, 'meta.ogImageAlt'),
  };
}
