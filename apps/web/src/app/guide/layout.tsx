import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { generateMetadataFromCookies } from '@/i18n/server-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  return generateMetadataFromCookies(cookieStore, 'guide');
}

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
