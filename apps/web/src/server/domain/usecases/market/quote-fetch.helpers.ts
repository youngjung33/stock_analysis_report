/** 게스트 quotes API·RefreshQuotes 공통 — provider 가용성·실패 reasonCode 기록 */

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

/** 실패 종목을 RefreshQuoteResult.failed 형식으로 누적 */
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

/** 단일 종목 시세 — 미지원·미설정·fetch 예외 시 null + failed 기록 */
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
