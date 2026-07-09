'use client';

import { Market } from '@sar/shared';
import { StockDetailContent } from '../components/StockDetailContent';
import { AppShell } from '../layout';

interface Props {
  symbol: string;
  market: Market;
}

export function StockDetailPage({ symbol, market }: Props) {
  return (
    <AppShell title="종목 상세" subtitle={symbol} maxWidth="3xl">
      <StockDetailContent symbol={symbol} market={market} />
    </AppShell>
  );
}
