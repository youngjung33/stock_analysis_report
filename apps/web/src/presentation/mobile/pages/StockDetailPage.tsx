'use client';

import { Market } from '@sar/shared';
import { StockDetailContent } from '../../components/StockDetailContent';
import { MobileLayout } from '../layout/MobileLayout';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  symbol: string;
  market: Market;
}

export function MobileStockDetailPage({ symbol, market }: Props) {
  const { username, logout } = useAuth();

  return (
    <MobileLayout
      title="종목 상세"
      subtitle={username ?? undefined}
      onLogout={() => logout()}
      showFooterNav={false}
    >
      <StockDetailContent symbol={symbol} market={market} />
    </MobileLayout>
  );
}
