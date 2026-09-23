import { Market, REGION_SENTIMENT_INDEX_SYMBOL } from '@sar/shared';
import { MarketIndicesResult } from '../../entities';
import { IMarketDataProvider } from '../../ports/market-data.port';

/** 코스피·나스닥 지수 시세 조회 use case */
export class GetMarketIndicesUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  async execute(): Promise<MarketIndicesResult> {
    const [krIndexSeries, usIndexSeries] = await Promise.all([
      this.marketData.fetchChartSeries(REGION_SENTIMENT_INDEX_SYMBOL[Market.KR]).catch(() => null),
      this.marketData.fetchChartSeries(REGION_SENTIMENT_INDEX_SYMBOL[Market.US]).catch(() => null),
    ]);

    return {
      indices: [
        {
          name: 'KOSPI',
          yahooSymbol: REGION_SENTIMENT_INDEX_SYMBOL[Market.KR],
          market: Market.KR,
          currentPrice: krIndexSeries?.currentPrice ?? null,
          changePercent1d: krIndexSeries?.changePercent1d ?? null,
        },
        {
          name: 'NASDAQ',
          yahooSymbol: REGION_SENTIMENT_INDEX_SYMBOL[Market.US],
          market: Market.US,
          currentPrice: usIndexSeries?.currentPrice ?? null,
          changePercent1d: usIndexSeries?.changePercent1d ?? null,
        },
      ],
      fetchedAt: new Date().toISOString(),
    };
  }
}
