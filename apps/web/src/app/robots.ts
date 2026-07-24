import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/i18n/server-metadata';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/settings'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
