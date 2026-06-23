'use client';

import { Market } from '@sar/shared';
import { useAuth } from '../../hooks/useAuth';
import { StockDetailContent } from '../../components/StockDetailContent';
import { DesktopLayout } from '../layout/DesktopLayout';
import { DesktopNavMenu } from '../navigation/DesktopNavMenu';

interface Props {
  symbol: string;
  market: Market;
}

export function DesktopStockDetailPage({ symbol, market }: Props) {
  const { username, logout } = useAuth();

  return (
    <DesktopLayout
      title="종목 상세"
      subtitle={symbol}
      headerActions={
        <DesktopNavMenu
          username={username ?? undefined}
          onLogout={() => logout()}
          active="dashboard"
        />
      }
    >
      <main className="mx-auto max-w-3xl px-6 py-8">
        <StockDetailContent symbol={symbol} market={market} />
      </main>
    </DesktopLayout>
  );
}
