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
import { throttleAfterKrProviderSuccess } from './recommendation-provider-throttle';

export interface RecommendationEventRequest {
  symbol: string;
  market: Market;
  /** KR/US — earnings·공시 실패 시 뉴스 헤드라인 fallback */
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

      const snap = await this.resolveSnapshot(stock, catalogCorpCodes);
      if (snap) {
        setCachedRecommendationEvent(snap);
        snapshots.push(snap);
        if (quality) quality.received += 1;
        if (stock.market === Market.KR) {
          await throttleAfterKrProviderSuccess();
        }
      } else if (quality) {
        quality.failed += 1;
      }
    }

    return snapshots;
  }

  private async resolveSnapshot(
    stock: RecommendationEventRequest,
    catalogCorpCodes: Record<string, string>,
  ): Promise<StockEventSnapshot | null> {
    try {
      const primary = await this.fetchPrimarySnapshot(stock, catalogCorpCodes);
      if (primary) return primary;
    } catch {
      /* headline fallback below */
    }

    return this.headlineFallback(stock);
  }

  private headlineFallback(stock: RecommendationEventRequest): StockEventSnapshot | null {
    if (!stock.headlineSample?.trim()) return null;
    return buildStockEventFromHeadline({
      symbol: stock.symbol,
      market: stock.market,
      headline: stock.headlineSample,
    });
  }

  private async fetchPrimarySnapshot(
    stock: RecommendationEventRequest,
    catalogCorpCodes: Record<string, string>,
  ): Promise<StockEventSnapshot | null> {
    if (stock.market === Market.US) {
      try {
        const earnings = await this.marketData.fetchCompanyEarnings(stock.symbol);
        const snap = buildStockEventSnapshot({
          symbol: stock.symbol,
          market: stock.market,
          earnings,
        });
        if (snap) return snap;
      } catch {
        return this.headlineFallback(stock);
      }
      return this.headlineFallback(stock);
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

    return this.headlineFallback(stock);
  }
}
