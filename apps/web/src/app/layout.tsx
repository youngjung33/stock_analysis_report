import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { generateMetadataFromCookies, getServerLocale } from '@/i18n/server-metadata';
import { Providers } from './providers';
import './globals.css';
import './globals.scss';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  return generateMetadataFromCookies(cookieStore, 'home');
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = getServerLocale(cookieStore);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
