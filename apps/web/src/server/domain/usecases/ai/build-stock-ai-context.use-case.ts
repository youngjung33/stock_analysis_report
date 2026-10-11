import {
  AI_SCHEMA_VERSION,
  Market,
  pickStockEnrichment,
  pickNewsTitlesForAi,
  buildStockDerivedFacts,
  detectMarketRegimes,
  findRegionSentimentIndex,
  resolveRegionSentimentsFromIndices,
  type StockAiContext,
  type SupportedLocale,
} from '@sar/shared';
import { BuildStockAnalysisReportUseCase } from '../market/build-stock-analysis-report.use-case';
import { BuildMarketContextUseCase } from '../market/build-market-context.use-case';
import { GetDashboardUseCase } from '../portfolio/get-dashboard.use-case';
import { ListWatchlistUseCase } from '../watchlist/watchlist.use-cases';
import { computeContextHash } from '@/server/data/ai/context-hash';
import { rethrowAiContextUnavailable } from './context-build.helpers';

export class BuildStockAiContextUseCase {
  constructor(
    private readonly buildStockAnalysisReportUseCase: BuildStockAnalysisReportUseCase,
    private readonly buildMarketContextUseCase: BuildMarketContextUseCase,
    private readonly getDashboardUseCase: GetDashboardUseCase,
    private readonly listWatchlistUseCase: ListWatchlistUseCase,
  ) {}

  async execute(input: {
    userId: string;
    symbol: string;
    name: string;
    market: Market;
    yahooSymbol?: string;
    locale: SupportedLocale;
  }): Promise<StockAiContext> {
    let dashboard;
    try {
      dashboard = await this.getDashboardUseCase.execute(input.userId);
    } catch (error) {
      rethrowAiContextUnavailable(error);
    }

    let userWatchlist: Array<{ symbol: string; market: Market }> = [];
    try {
      const items = await this.listWatchlistUseCase.execute(input.userId);
      userWatchlist = items.map((w) => ({ symbol: w.symbol, market: w.market }));
    } catch (error) {
      rethrowAiContextUnavailable(error);
    }

    const userHoldings = dashboard.holdings.map((h) => ({ symbol: h.symbol, market: h.market }));

    let reportBundle;
    try {
      reportBundle = await this.buildStockAnalysisReportUseCase.execute({
        symbol: input.symbol,
        name: input.name,
        market: input.market,
        yahooSymbol: input.yahooSymbol,
        userHoldings,
        userWatchlist,
      });
    } catch (error) {
      rethrowAiContextUnavailable(error);
    }

    let marketContext;
    try {
      marketContext = await this.buildMarketContextUseCase.execute();
    } catch (error) {
      rethrowAiContextUnavailable(error);
    }

    const { snapshots, ...report } = reportBundle;
    const technical = pickStockEnrichment(snapshots.technicalSnapshots, input.symbol, input.market);
    const news = pickStockEnrichment(snapshots.newsSnapshots, input.symbol, input.market);
    const event = pickStockEnrichment(snapshots.eventSnapshots, input.symbol, input.market);

    const holding = dashboard.holdings.find(
      (h) => h.symbol.toUpperCase() === input.symbol.toUpperCase() && h.market === input.market,
    );
    const totalValue = dashboard.summary.totalAssetsKrw ?? dashboard.summary.totalMarketValueKrw ?? 0;
    const weight =
      holding?.marketValueKrw != null && totalValue > 0
        ? (holding.marketValueKrw / totalValue) * 100
        : null;

    const isHeld = Boolean(holding);
    const isWatchlisted = userWatchlist.some(
      (w) => w.symbol.toUpperCase() === input.symbol.toUpperCase() && w.market === input.market,
    );
    const primaryIndex = findRegionSentimentIndex(marketContext.indices, input.market);
    const { kr: krSentiment, us: usSentiment } = resolveRegionSentimentsFromIndices(
      marketContext.indices,
    );
    const detectedRegimes = detectMarketRegimes({
      krSentiment,
      usSentiment,
      macro: marketContext.macro,
      usdKrwChange1d: marketContext.usdKrwChange1d ?? null,
    });

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
        regimeIds: detectedRegimes.map((r) => r.id),
        indexChange1d: primaryIndex?.changePercent1d ?? null,
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
      dataQuality: report.dataQuality,
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
