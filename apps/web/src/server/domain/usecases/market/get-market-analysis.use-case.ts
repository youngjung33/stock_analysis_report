import {
  INDEX_BENCHMARKS,
  KR_SECTOR_BENCHMARK,
  MACRO_INDICATORS,
  SECTOR_ETFS,
  US_SECTOR_BENCHMARK,
  IndexTechnicalInput,
  MacroSeriesInput,
  Market,
  MarketAnalysisReport,
  NewsAnalysisInput,
  SectorSeriesInput,
  buildMarketAnalysisReport,
} from '@sar/shared';
import { fetchFinnhubMarketNews } from '../../../data/market/finnhub-news.client';
import { fetchGoogleNewsRss } from '../../../data/market/google-news-rss.client';
import { fetchYahooChartSeries, YahooChartSeries } from '../../../data/market/yahoo-chart.client';
import { GetFeaturedQuotesUseCase } from './get-featured-quotes.use-case';

export class GetMarketAnalysisUseCase {
  constructor(private readonly getFeaturedQuotesUseCase: GetFeaturedQuotesUseCase) {}

  async execute(): Promise<MarketAnalysisReport> {
    const featured = await this.getFeaturedQuotesUseCase.execute();

    const sectorBenchmarks = [US_SECTOR_BENCHMARK.yahooSymbol, KR_SECTOR_BENCHMARK.yahooSymbol];
    const allSymbols = [
      ...new Set([
        ...INDEX_BENCHMARKS.map((b) => b.yahooSymbol),
        ...MACRO_INDICATORS.map((m) => m.yahooSymbol),
        ...SECTOR_ETFS.map((s) => s.yahooSymbol),
        ...sectorBenchmarks,
      ]),
    ];

    const [seriesResults, krNews, usNewsGoogle, finnhubNews] = await Promise.all([
      Promise.allSettled(allSymbols.map((sym) => fetchYahooChartSeries(sym))),
      fetchGoogleNewsRss('코스피+증시+주식', Market.KR, 'ko', 'KR', 6).catch(() => []),
      fetchGoogleNewsRss('US+stock+market+S&P', Market.US, 'en-US', 'US', 6).catch(() => []),
      fetchFinnhubMarketNews('general', 6).catch(() => []),
    ]);

    const seriesMap = new Map<string, YahooChartSeries>();
    allSymbols.forEach((sym, i) => {
      const result = seriesResults[i];
      if (result.status === 'fulfilled') {
        seriesMap.set(sym, result.value);
      }
    });

    const indexInputs: IndexTechnicalInput[] = INDEX_BENCHMARKS.flatMap((bench) => {
      const series = seriesMap.get(bench.yahooSymbol);
      if (!series) return [];
      return [
        {
          yahooSymbol: bench.yahooSymbol,
          name: bench.name,
          market: bench.market,
          closes: series.closes,
          volumes: series.volumes,
          highs: series.highs,
          lows: series.lows,
          changePercent1d: series.changePercent1d,
          chartUrl: bench.chartUrl,
          tradingViewUrl: bench.tradingViewUrl ?? bench.chartUrl,
        },
      ];
    });

    const macroInputs: MacroSeriesInput[] = MACRO_INDICATORS.flatMap((m) => {
      const series = seriesMap.get(m.yahooSymbol);
      if (!series) return [];
      return [
        {
          yahooSymbol: m.yahooSymbol,
          name: m.name,
          kind: m.kind,
          unit: m.unit,
          closes: series.closes,
          changePercent1d: series.changePercent1d,
          chartUrl: m.chartUrl,
          tradingViewUrl: m.tradingViewUrl,
        },
      ];
    });

    const spyCloses = seriesMap.get(US_SECTOR_BENCHMARK.yahooSymbol)?.closes ?? [];
    const krBenchCloses = seriesMap.get(KR_SECTOR_BENCHMARK.yahooSymbol)?.closes ?? [];

    const sectorInputs: SectorSeriesInput[] = SECTOR_ETFS.flatMap((etf) => {
      const series = seriesMap.get(etf.yahooSymbol);
      if (!series) return [];
      const benchmarkCloses =
        etf.market === Market.US
          ? spyCloses.length > 0
            ? spyCloses
            : series.closes
          : krBenchCloses.length > 0
            ? krBenchCloses
            : series.closes;
      return [
        {
          yahooSymbol: etf.yahooSymbol,
          name: etf.name,
          sectorLabel: etf.sectorLabel,
          market: etf.market,
          closes: series.closes,
          changePercent1d: series.changePercent1d,
          chartUrl: etf.chartUrl,
          benchmarkCloses,
        },
      ];
    });

    const news: NewsAnalysisInput[] = [
      ...krNews.map((n) => ({ ...n, market: Market.KR as Market | 'global' })),
      ...usNewsGoogle.map((n) => ({ ...n, market: Market.US as Market | 'global' })),
      ...finnhubNews.map((n) => ({
        title: n.headline,
        source: n.source,
        publishedAt: new Date(n.datetime * 1000).toISOString(),
        url: n.url,
        market: 'global' as const,
      })),
    ];

    return buildMarketAnalysisReport({
      krQuotes: featured.kr,
      usQuotes: featured.us,
      indexInputs,
      macroInputs,
      sectorInputs,
      news,
      fetchedAt: new Date().toISOString(),
    });
  }
}
