import {
  AI_SCHEMA_VERSION,
  Market,
  pickStockEnrichment,
  pickNewsTitlesForAi,
  buildStockDerivedFacts,
  resolveCurrency,
  type StockAiContext,
  type SupportedLocale,
} from '@sar/shared';
import { BuildStockAnalysisReportUseCase } from '../market/build-stock-analysis-report.use-case';
import { BuildMarketContextUseCase } from '../market/build-market-context.use-case';
import { BuildStockEnrichmentUseCase } from '../market/build-stock-enrichment.use-case';
import { GetDashboardUseCase } from '../portfolio/get-dashboard.use-case';
import { computeContextHash } from '@/server/data/ai/context-hash';
import {
  EMPTY_MARKET_CONTEXT,
  EMPTY_STOCK_ENRICHMENT,
  rethrowAiContextUnavailable,
  withContextFallback,
} from './context-build.helpers';

export class BuildStockAiContextUseCase {
  constructor(
    private readonly buildStockAnalysisReportUseCase: BuildStockAnalysisReportUseCase,
    private readonly buildMarketContextUseCase: BuildMarketContextUseCase,
    private readonly buildStockEnrichmentUseCase: BuildStockEnrichmentUseCase,
    private readonly getDashboardUseCase: GetDashboardUseCase,
  ) {}

  async execute(input: {
    userId: string;
    symbol: string;
    name: string;
    market: Market;
    yahooSymbol?: string;
    locale: SupportedLocale;
    userHoldings?: Array<{ symbol: string; market: Market }>;
    userWatchlist?: Array<{ symbol: string; market: Market }>;
  }): Promise<StockAiContext> {
    let report;
    try {
      report = await this.buildStockAnalysisReportUseCase.execute({
        symbol: input.symbol,
        name: input.name,
        market: input.market,
        yahooSymbol: input.yahooSymbol,
        userHoldings: input.userHoldings,
        userWatchlist: input.userWatchlist,
      });
    } catch (error) {
      rethrowAiContextUnavailable(error);
    }

    const [marketContext, dashboard] = await Promise.all([
      withContextFallback('stock.marketContext', EMPTY_MARKET_CONTEXT, () =>
        this.buildMarketContextUseCase.execute(),
      ),
      (async () => {
        try {
          return await this.getDashboardUseCase.execute(input.userId);
        } catch (error) {
          rethrowAiContextUnavailable(error);
        }
      })(),
    ]);

    const currency = resolveCurrency(input.market);
    const target = {
      symbol: input.symbol,
      name: input.name,
      market: input.market,
      currency,
      yahooSymbol: input.yahooSymbol,
    };
    const enrichment = await withContextFallback('stock.enrichment', EMPTY_STOCK_ENRICHMENT, () =>
      this.buildStockEnrichmentUseCase.execute([target]),
    );
    const technical = pickStockEnrichment(enrichment.technicalSnapshots, input.symbol, input.market);
    const news = pickStockEnrichment(enrichment.newsSnapshots, input.symbol, input.market);
    const event = pickStockEnrichment(enrichment.eventSnapshots, input.symbol, input.market);

    const holding = dashboard.holdings.find(
      (h) => h.symbol.toUpperCase() === input.symbol.toUpperCase() && h.market === input.market,
    );
    const totalValue = dashboard.summary.totalAssetsKrw ?? dashboard.summary.totalMarketValueKrw ?? 0;
    const weight =
      holding?.marketValueKrw != null && totalValue > 0
        ? (holding.marketValueKrw / totalValue) * 100
        : null;

    const isHeld = Boolean(holding);
    const isWatchlisted = Boolean(
      input.userWatchlist?.some(
        (w) => w.symbol.toUpperCase() === input.symbol.toUpperCase() && w.market === input.market,
      ),
    );

    const recentNewsTitles = pickNewsTitlesForAi(news?.recentTitles, news?.headlineSample);

    const facts = {
      instrument: {
        symbol: report.symbol,
        name: report.name,
        market: report.market as 'KR' | 'US',
        currency: report.currency,
      },
      price: {
        current: report.currentPrice,
        change1d: report.changePercent1d,
        change1w: report.changePercent1w,
        change1mo: report.changePercent1mo,
      },
      ruleBasedReport: {
        tag: report.tag,
        tagLabel: report.tagLabel,
        score: report.score,
        insights: report.insights.slice(0, 5).map((i) => ({
          category: i.category,
          title: i.title,
          body: i.summary,
        })),
        scoreBreakdown: report.scoreBreakdown.slice(0, 5).map((s) => ({
          label: s.factor,
          score: s.delta,
          maxScore: 1,
        })),
      },
      technical: technical
        ? {
            rsi14: technical.rsi14,
            macdSignal: null,
            trend: technical.trendKey,
          }
        : null,
      marketLink: {
        regimeIds: marketContext.macro.slice(0, 3).map((m) => m.interpretKey),
        indexChange1d: marketContext.indices[0]?.changePercent1d ?? null,
        leadingSectors: marketContext.sectors.slice(0, 3).map((s) => s.name),
      },
      userLink: {
        isHeld,
        isWatchlisted,
        portfolioWeightPercent: weight,
        unrealizedPnlPercent: holding?.unrealizedPnlPercent ?? null,
      },
      recentNewsTitles,
      recentEvent: event
        ? {
            kind: event.kind,
            eventDay: event.eventDay,
            source: event.source,
          }
        : null,
      derived: buildStockDerivedFacts({
        change1d: report.changePercent1d,
        rsi14: technical?.rsi14 ?? null,
        newsTone: news?.tone ?? null,
        eventKind: event?.kind ?? null,
        eventDay: event?.eventDay ?? null,
        ruleTag: report.tag,
      }),
    };

    const contextHash = computeContextHash({ kind: 'stock', facts });

    return {
      schemaVersion: AI_SCHEMA_VERSION,
      kind: 'stock',
      locale: input.locale,
      generatedAt: new Date().toISOString(),
      contextHash,
      constraints: { maxSections: 5, tone: 'educational', noTradeAdvice: true },
      facts,
    };
  }
}
