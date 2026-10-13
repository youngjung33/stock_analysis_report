import {
  Market,
  QuoteChartRange,
  resolveCurrency,
  buildStockPriceExplanationReport,
  pickStockEnrichment,
  isEnrichmentBatchIncomplete,
  type StockEventSnapshot,
  type StockNewsSnapshot,
  type StockTechnicalSnapshot,
} from '@sar/shared';
import { BuildMarketContextUseCase } from './build-market-context.use-case';
import { BuildStockEnrichmentUseCase } from './build-stock-enrichment.use-case';
import { GetStockQuoteUseCase } from './get-stock-quote.use-case';

export interface StockAnalysisEnrichmentSnapshots {
  technicalSnapshots: StockTechnicalSnapshot[];
  newsSnapshots: StockNewsSnapshot[];
  eventSnapshots: StockEventSnapshot[];
}

/** 서버: 차트·enrichment 수집 후 종목 가격 해설 리포트 조립 */
export class BuildStockAnalysisReportUseCase {
  constructor(
    private readonly buildMarketContextUseCase: BuildMarketContextUseCase,
    private readonly buildStockEnrichmentUseCase: BuildStockEnrichmentUseCase,
    private readonly getStockQuoteUseCase: GetStockQuoteUseCase,
  ) {}

  async execute(input: {
    symbol: string;
    name: string;
    market: Market;
    yahooSymbol?: string;
    userHoldings?: Array<{ symbol: string; market: Market }>;
    userWatchlist?: Array<{ symbol: string; market: Market }>;
  }) {
    const [marketContext, chartQuote] = await Promise.all([
      this.buildMarketContextUseCase.execute(),
      this.getStockQuoteUseCase.execute({
        symbol: input.symbol,
        market: input.market,
        range: '6mo' as QuoteChartRange,
      }),
    ]);

    const currency = resolveCurrency(input.market);
    const target = {
      symbol: input.symbol,
      name: input.name,
      market: input.market,
      currency,
      yahooSymbol: input.yahooSymbol,
    };

    const {
      technicalSnapshots,
      newsSnapshots,
      eventSnapshots,
      figureStatements,
      quality: enrichmentQuality,
    } = await this.buildStockEnrichmentUseCase.execute([target], {
      bypassCache: true,
      skipQuotes: true,
    });

    const quote = {
      symbol: input.symbol,
      name: input.name,
      market: input.market,
      currency,
      currentPrice: chartQuote.currentPrice,
      changePercent: chartQuote.changePercent,
    };

    const chartCloses = chartQuote.points.map((p) => p.close);
    const chartHighs = chartQuote.points.map((p) => p.high ?? p.close);
    const chartLows = chartQuote.points.map((p) => p.low ?? p.close);

    const report = buildStockPriceExplanationReport({
      quote,
      chartCloses,
      chartHighs,
      chartLows,
      technical: pickStockEnrichment(technicalSnapshots, input.symbol, input.market),
      news: pickStockEnrichment(newsSnapshots, input.symbol, input.market),
      event: pickStockEnrichment(eventSnapshots, input.symbol, input.market),
      macro: marketContext.macro,
      sectors: marketContext.sectors,
      indices: marketContext.indices,
      usdKrwRate: marketContext.usdKrwRate,
      usdKrwChange1d: marketContext.usdKrwChange1d,
      userHoldings: input.userHoldings,
      userWatchlist: input.userWatchlist,
      technicalSnapshots,
      newsSnapshots,
      eventSnapshots,
      figureStatements,
      fetchedAt: chartQuote.fetchedAt,
    });

    if (!report) {
      throw new Error('STOCK_ANALYSIS_UNAVAILABLE');
    }

    const dataQuality = {
      priceSource: 'live_chart' as const,
      quoteAsOf: chartQuote.fetchedAt,
      enrichment: enrichmentQuality,
      incompleteEnrichment: isEnrichmentBatchIncomplete(enrichmentQuality),
    };

    const snapshots: StockAnalysisEnrichmentSnapshots = {
      technicalSnapshots,
      newsSnapshots,
      eventSnapshots,
    };

    return { ...report, dataQuality, snapshots };
  }
}
