import { Market, QuoteChartRange, resolveCurrency, buildStockPriceExplanationReport, pickStockEnrichment } from '@sar/shared';
import { GetFeaturedQuotesUseCase } from './get-featured-quotes.use-case';
import { BuildMarketContextUseCase } from './build-market-context.use-case';
import { BuildStockEnrichmentUseCase } from './build-stock-enrichment.use-case';
import { GetStockQuoteUseCase } from './get-stock-quote.use-case';

/** 단일 종목 가격 해설 (과거·현재·관찰 전망) */
export class GetStockAnalysisUseCase {
  constructor(
    private readonly getFeaturedQuotesUseCase: GetFeaturedQuotesUseCase,
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
    const [featured, marketContext, chartQuote] = await Promise.all([
      this.getFeaturedQuotesUseCase.execute(),
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

    const { candidateQuotes, technicalSnapshots, newsSnapshots, eventSnapshots, figureStatements } =
      await this.buildStockEnrichmentUseCase.execute([target]);

    const quote =
      candidateQuotes.find(
        (q) => q.symbol.toUpperCase() === input.symbol.toUpperCase() && q.market === input.market,
      ) ??
      ({
        symbol: input.symbol,
        name: input.name,
        market: input.market,
        currency,
        currentPrice: chartQuote.currentPrice,
        changePercent: chartQuote.changePercent,
      } as const);

    const chartCloses = chartQuote.points.map((p) => p.close);

    const report = buildStockPriceExplanationReport({
      quote,
      chartCloses,
      chartHighs: chartCloses,
      chartLows: chartCloses,
      technical: pickStockEnrichment(technicalSnapshots, input.symbol, input.market),
      news: pickStockEnrichment(newsSnapshots, input.symbol, input.market),
      event: pickStockEnrichment(eventSnapshots, input.symbol, input.market),
      krQuotes: featured.kr,
      usQuotes: featured.us,
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
      fetchedAt: new Date().toISOString(),
    });

    if (!report) {
      throw new Error('STOCK_ANALYSIS_UNAVAILABLE');
    }

    return report;
  }
}
