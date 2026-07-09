'use client';

import { Market } from '@sar/shared';
import { StockDetailPage } from '../pages/StockDetailPage';

interface Props {
  symbol: string;
  market: Market;
}

export function StockDetailView({ symbol, market }: Props) {
  return <StockDetailPage symbol={symbol} market={market} />;
}
