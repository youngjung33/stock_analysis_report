import {
  Market,
  buildStockEventFromHeadline,
  buildStockEventFromKrDisclosure,
  buildStockEventSnapshot,
  resolveKrCorpCode,
  type StockEventSnapshot,
} from '@sar/shared';
import { IMarketDataProvider } from '../../ports/market-data.port';
import { IStockCatalogRepository } from '../../repositories';
import {
  getCachedRecommendationEvent,
  setCachedRecommendationEvent,
} from '../../../data/market/recommendation-events.cache';
import type { EnrichmentFetchOptions } from './enrichment-fetch.types';

export interface RecommendationEventRequest {
  symbol: string;
  market: Market;
  /** KR headline fallback when no earnings API */
  headlineSample?: string;
}

/** §8.3 — US Finnhub earnings + KR DART (Catalog corp_code) + headline fallback, 15m TTL */
export class FetchRecommendationEventSnapshotsUseCase {
  constructor(
    private readonly marketData: IMarketDataProvider,
    private readonly catalogRepo?: IStockCatalogRepository,
  ) {}

  async execute(
    stocks: RecommendationEventRequest[],
    options?: EnrichmentFetchOptions,
  ): Promise<StockEventSnapshot[]> {
    if (stocks.length === 0) return [];

    const krSymbols = stocks.filter((s) => s.market === Market.KR).map((s) => s.symbol);
    const catalogCorpCodes = this.catalogRepo
      ? await this.catalogRepo.findDartCorpCodesBySymbols(krSymbols).catch(() => ({}))
      : {};

    const snapshots: StockEventSnapshot[] = [];
    const seen = new Set<string>();
    const quality = options?.quality;

    for (const stock of stocks.slice(0, 40)) {
      const key = `${stock.market}:${stock.symbol.toUpperCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (quality) quality.requested += 1;

      const cached =
        options?.bypassCache ? null : getCachedRecommendationEvent(stock.symbol, stock.market);
      if (cached) {
        if (quality) {
          quality.cacheHits += 1;
          quality.received += 1;
        }
        snapshots.push(cached);
        continue;
      }

      try {
        const snap = await this.fetchSnapshot(stock, catalogCorpCodes);
        if (snap) {
          setCachedRecommendationEvent(snap);
          snapshots.push(snap);
          if (quality) quality.received += 1;
        } else if (quality) {
          quality.failed += 1;
        }
      } catch {
        if (quality) quality.failed += 1;
      }

      if (stock.market === Market.US) {
        await sleep(1100);
      } else {
        await sleep(250);
      }
    }

    return snapshots;
  }

  private async fetchSnapshot(
    stock: RecommendationEventRequest,
    catalogCorpCodes: Record<string, string>,
  ): Promise<StockEventSnapshot | null> {
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
      const corpCode = resolveKrCorpCode(stock.symbol, catalogCorpCodes);
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
