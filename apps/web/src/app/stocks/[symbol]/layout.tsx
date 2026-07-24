import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { generateMetadataFromCookies } from '@/i18n/server-metadata';

type Props = {
  children: React.ReactNode;
  params: Promise<{ symbol: string }>;
};

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { symbol } = await params;
  const cookieStore = await cookies();
  return generateMetadataFromCookies(cookieStore, 'stock', {
    symbol: decodeURIComponent(symbol),
  });
}

export default function StockDetailLayout({ children }: Props) {
  return children;
}
