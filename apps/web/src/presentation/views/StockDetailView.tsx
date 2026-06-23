'use client';

import { useIsMobile } from '../hooks/useBreakpoint';
import { DesktopStockDetailPage } from '../desktop/pages/StockDetailPage';
import { MobileStockDetailPage } from '../mobile/pages/StockDetailPage';
import { Market } from '@sar/shared';

interface Props {
  symbol: string;
  market: Market;
}

export function StockDetailView({ symbol, market }: Props) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <MobileStockDetailPage symbol={symbol} market={market} />
  ) : (
    <DesktopStockDetailPage symbol={symbol} market={market} />
  );
}
