import { ImageResponse } from 'next/og';
import { cookies } from 'next/headers';
import { OgImageLayout } from '@/brand/og-image-content';
import { getOgImageCopy, getServerLocale } from '@/i18n/server-metadata';

export const runtime = 'edge';
export const alt = 'SAR Portfolio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const cookieStore = await cookies();
  const locale = getServerLocale(cookieStore);
  const copy = getOgImageCopy(locale);

  return new ImageResponse(<OgImageLayout copy={copy} />, size);
}
