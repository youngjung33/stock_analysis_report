import { Market, type QuoteFailureReasonCode } from '@sar/shared';
import type { RefreshQuoteResult } from '../../entities';
import type { IMarketDataProvider } from '../../ports/market-data.port';
import type { StockEntity } from '../../entities';

type QuoteFailure = RefreshQuoteResult['failed'][number];

interface QuoteStock {
  id: string;
  symbol: string;
  market: Market;
}

export function recordQuoteFailure(
  failed: QuoteFailure[],
  stock: QuoteStock,
  reasonCode: QuoteFailureReasonCode,
): void {
  failed.push({
    stockId: stock.id,
    symbol: stock.symbol,
    market: stock.market,
    reasonCode,
  });
}

export async function fetchQuoteForStock(
  marketData: IMarketDataProvider,
  stock: StockEntity,
  failed: QuoteFailure[],
): Promise<{ currentPrice: number; changePercent: number | null } | null> {
  const market = stock.market as Market;

  if (!marketData.supports(market)) {
    recordQuoteFailure(failed, stock, 'no_provider');
    return null;
  }

  if (!marketData.isAvailable(market)) {
    recordQuoteFailure(failed, stock, 'not_configured');
    return null;
  }

  try {
    return await marketData.fetchStockQuote(stock);
  } catch {
    recordQuoteFailure(failed, stock, 'fetch_error');
    return null;
  }
}
