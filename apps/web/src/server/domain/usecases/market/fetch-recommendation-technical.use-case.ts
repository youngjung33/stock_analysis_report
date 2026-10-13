import {
  Market,
  buildStockTechnicalSnapshot,
  changePercentOverBars,
  type StockTechnicalSnapshot,
} from '@sar/shared';
import { resolveYahooSymbol } from '../../services/stock-symbol.resolver';
import { IMarketDataProvider } from '../../ports/market-data.port';
import {
  getCachedRecommendationTechnical,
  setCachedRecommendationTechnical,
} from '../../../data/market/recommendation-technical.cache';
import type { EnrichmentFetchOptions } from './enrichment-fetch.types';
import { throttleAfterUsProviderSuccess } from './recommendation-provider-throttle';

export interface RecommendationTechnicalRequest {
  symbol: string;
  market: Market;
  yahooSymbol?: string;
}

const BENCHMARK_YAHOO: Record<Market, string> = {
  [Market.KR]: '^KS11',
  [Market.US]: '^GSPC',
};

/** §8.1 — candidate pool chart snapshots, 15m TTL, US rate-limit sleep */
export class FetchRecommendationTechnicalSnapshotsUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  async execute(
    stocks: RecommendationTechnicalRequest[],
    options?: EnrichmentFetchOptions,
  ): Promise<StockTechnicalSnapshot[]> {
    if (stocks.length === 0) return [];

    const benchmark1w = await this.loadBenchmark1wChanges();
    const snapshots: StockTechnicalSnapshot[] = [];
    const seen = new Set<string>();
    const quality = options?.quality;

    for (const stock of stocks.slice(0, 40)) {
      const key = `${stock.market}:${stock.symbol.toUpperCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (quality) quality.requested += 1;

      const cached =
        options?.bypassCache ? null : getCachedRecommendationTechnical(stock.symbol, stock.market);
      if (cached) {
        if (quality) {
          quality.cacheHits += 1;
          quality.received += 1;
        }
        snapshots.push(cached);
        continue;
      }

      if (!this.marketData.supports(stock.market) || !this.marketData.isAvailable(stock.market)) {
        if (quality) quality.failed += 1;
        continue;
      }

      let usThrottle = false;
      try {
        const yahoo =
          stock.yahooSymbol ?? resolveYahooSymbol(stock.symbol, stock.market);
        if (!yahoo) {
          if (quality) quality.failed += 1;
          continue;
        }
        const series = await this.marketData.fetchChartSeries(yahoo, '6mo');
        const snap = buildStockTechnicalSnapshot(
          {
            symbol: stock.symbol,
            market: stock.market,
            closes: series.closes,
            highs: series.highs,
            lows: series.lows,
          },
          benchmark1w[stock.market],
        );
        if (snap) {
          setCachedRecommendationTechnical(snap);
          snapshots.push(snap);
          if (quality) quality.received += 1;
          usThrottle = stock.market === Market.US;
        } else if (quality) {
          quality.failed += 1;
        }
      } catch {
        if (quality) quality.failed += 1;
      }

      if (usThrottle) {
        await throttleAfterUsProviderSuccess();
      }
    }

    return snapshots;
  }

  private async loadBenchmark1wChanges(): Promise<Record<Market, number | null>> {
    const result: Record<Market, number | null> = {
      [Market.KR]: null,
      [Market.US]: null,
    };

    for (const market of [Market.KR, Market.US]) {
      try {
        const series = await this.marketData.fetchChartSeries(BENCHMARK_YAHOO[market], '6mo');
        result[market] = changePercentOverBars(series.closes, 5);
      } catch {
        result[market] = null;
      }
    }

    return result;
  }
}
