import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import './globals.scss';

export const metadata: Metadata = {
  title: '주식 투자 현황',
  description: '개인용 주식 매매·배당·세금 관리',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
