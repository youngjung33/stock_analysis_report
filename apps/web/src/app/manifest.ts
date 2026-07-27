import type { MetadataRoute } from 'next';
import { cookies } from 'next/headers';
import { getServerLocale, translateSeo } from '@/i18n/server-metadata';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const cookieStore = await cookies();
  const locale = getServerLocale(cookieStore);

  return {
    name: translateSeo(locale, 'meta.title'),
    short_name: translateSeo(locale, 'meta.siteName'),
    description: translateSeo(locale, 'meta.description'),
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    lang: locale,
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { src: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  };
}
