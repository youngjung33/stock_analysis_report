import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { generateMetadataFromCookies, getServerLocale } from '@/i18n/server-metadata';
import { getServerTheme, themeHtmlClass } from '@/theme';
import { Providers } from './providers';
import './globals.css';
import './theme.light.css';
import './globals.scss';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  return generateMetadataFromCookies(cookieStore, 'home');
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = getServerLocale(cookieStore);
  const theme = getServerTheme(cookieStore);

  return (
    <html lang={locale} className={themeHtmlClass(theme)} suppressHydrationWarning>
      <body>
        <Providers initialLocale={locale} initialTheme={theme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
