import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/i18n/server-metadata';
import { SITEMAP_PATHS } from '@/i18n/seo-routes';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return SITEMAP_PATHS.map((path) => ({
    url: `${siteUrl}${path === '/' ? '' : path}`,
    lastModified,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
