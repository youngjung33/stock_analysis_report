import {
  Market,
  buildStockEventFromHeadline,
  buildStockEventFromKrDisclosure,
  buildStockEventSnapshot,
  resolveKrCorpCode,
  type StockEventSnapshot,
} from '@sar/shared';
import { IMarketDataProvider } from '../../ports/market-data.port';
import {
  getCachedRecommendationEvent,
  setCachedRecommendationEvent,
} from '../../../data/market/recommendation-events.cache';

export interface RecommendationEventRequest {
  symbol: string;
  market: Market;
  /** KR headline fallback when no earnings API */
  headlineSample?: string;
}

/** §8.3 — US Finnhub earnings + KR DART disclosures + headline fallback, 15m TTL */
export class FetchRecommendationEventSnapshotsUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  async execute(stocks: RecommendationEventRequest[]): Promise<StockEventSnapshot[]> {
    if (stocks.length === 0) return [];

    const snapshots: StockEventSnapshot[] = [];
    const seen = new Set<string>();

    for (const stock of stocks.slice(0, 40)) {
      const key = `${stock.market}:${stock.symbol.toUpperCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const cached = getCachedRecommendationEvent(stock.symbol, stock.market);
      if (cached) {
        snapshots.push(cached);
        continue;
      }

      try {
        const snap = await this.fetchSnapshot(stock);
        if (snap) {
          setCachedRecommendationEvent(snap);
          snapshots.push(snap);
        }
      } catch {
        // skip failed symbol
      }

      if (stock.market === Market.US) {
        await sleep(1100);
      } else {
        await sleep(250);
      }
    }

    return snapshots;
  }

  private async fetchSnapshot(stock: RecommendationEventRequest): Promise<StockEventSnapshot | null> {
    if (stock.market === Market.US) {
      const earnings = await this.marketData.fetchCompanyEarnings(stock.symbol);
      const snap = buildStockEventSnapshot({
        symbol: stock.symbol,
        market: stock.market,
        earnings,
      });
      if (snap) return snap;
    }

    if (stock.market === Market.KR) {
      const corpCode = resolveKrCorpCode(stock.symbol);
      if (corpCode) {
        const disclosures = await this.marketData.fetchKrDisclosures(corpCode);
        const dartSnap = buildStockEventFromKrDisclosure({
          symbol: stock.symbol,
          market: stock.market,
          disclosures,
        });
        if (dartSnap) return dartSnap;
      }
    }

    if (stock.headlineSample) {
      return buildStockEventFromHeadline({
        symbol: stock.symbol,
        market: stock.market,
        headline: stock.headlineSample,
      });
    }

    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
