import { Market } from '@sar/shared';
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
  reason: string,
  reasonCode: QuoteFailure['reasonCode'],
): void {
  failed.push({
    stockId: stock.id,
    symbol: stock.symbol,
    market: stock.market,
    reason,
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
    recordQuoteFailure(
      failed,
      stock,
      `${stock.market} 시장용 시세 API가 없습니다.`,
      'no_provider',
    );
    return null;
  }

  if (!marketData.isAvailable(market)) {
    recordQuoteFailure(
      failed,
      stock,
      marketData.unavailableReason(market) ?? '시세 API가 설정되지 않았습니다.',
      'not_configured',
    );
    return null;
  }

  try {
    return await marketData.fetchStockQuote(stock);
  } catch (err) {
    recordQuoteFailure(
      failed,
      stock,
      err instanceof Error ? err.message : '시세 조회에 실패했습니다.',
      'fetch_error',
    );
    return null;
  }
}
