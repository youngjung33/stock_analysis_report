import { ImageResponse } from 'next/og';
import { OgImageLayout } from '@/brand/og-image-content';

export const runtime = 'edge';
export const alt = 'SAR Portfolio — Stock Analysis Report';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(<OgImageLayout />, size);
}
