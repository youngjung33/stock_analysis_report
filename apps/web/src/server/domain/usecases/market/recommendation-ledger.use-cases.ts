import {
  GLOBAL_RECOMMENDATION_PROFILE_KEY,
  INDEX_BENCHMARKS,
  Market,
  RECOMMENDATION_ENGINE_VERSION,
  RECOMMENDATION_OUTCOME_HORIZONS,
  buildCandidatePool,
  buildGlobalBaselineRecommendations,
  computeReturnPercent,
  horizonReady,
  kstTradingDate,
  toFeaturedQuoteInputs,
  type RecommendationBatchMacroSnapshot,
  type RecommendationOutcomeHorizon,
} from '@sar/shared';
import { resolveYahooSymbol } from '../../services/stock-symbol.resolver';
import { IMarketDataProvider } from '../../ports/market-data.port';
import { IStockCatalogRepository } from '../../repositories';
import { IRecommendationLedgerRepository } from '../../../data/persistence/recommendation-ledger.repository';
import type { RecommendationBatchEntity } from '../../entities/recommendation-ledger.entities';
import { BuildMarketContextUseCase } from './build-market-context.use-case';
import { BuildStockEnrichmentUseCase } from './build-stock-enrichment.use-case';
import { GetFeaturedQuotesUseCase } from './get-featured-quotes.use-case';

function symbolKey(symbol: string, market: Market): string {
  return `${market}:${symbol.toUpperCase()}`;
}

async function fetchBenchmarkPrices(
  marketData: IMarketDataProvider,
): Promise<RecommendationBatchMacroSnapshot['benchmarks']> {
  const benchmarks: RecommendationBatchMacroSnapshot['benchmarks'] = [];

  for (const bench of INDEX_BENCHMARKS.filter((b) => b.yahooSymbol === '^KS11' || b.yahooSymbol === '^GSPC')) {
    try {
      const series = await marketData.fetchChartSeries(bench.yahooSymbol);
      const last = series.closes.at(-1);
      if (last != null && last > 0) {
        benchmarks.push({
          yahooSymbol: bench.yahooSymbol,
          name: bench.name,
          market: bench.market,
          priceAtRun: last,
        });
      }
    } catch {
      // skip failed benchmark
    }
  }

  return benchmarks;
}

function benchmarkPriceAtRun(
  macroSnapshot: unknown | null,
  market: Market,
): number | null {
  if (!macroSnapshot || typeof macroSnapshot !== 'object') return null;
  const snap = macroSnapshot as RecommendationBatchMacroSnapshot;
  const yahoo = market === Market.KR ? '^KS11' : '^GSPC';
  const hit = snap.benchmarks?.find((b) => b.yahooSymbol === yahoo);
  return hit?.priceAtRun ?? null;
}

export class RunGlobalRecommendationBatchUseCase {
  constructor(
    private readonly ledgerRepo: IRecommendationLedgerRepository,
    private readonly featuredQuotesUseCase: GetFeaturedQuotesUseCase,
    private readonly buildMarketContextUseCase: BuildMarketContextUseCase,
    private readonly buildStockEnrichmentUseCase: BuildStockEnrichmentUseCase,
    private readonly catalogRepo: IStockCatalogRepository,
    private readonly marketData: IMarketDataProvider,
  ) {}

  async execute(options?: { force?: boolean }): Promise<{
    status: 'created' | 'skipped';
    batch: RecommendationBatchEntity | null;
    tradingDate: string;
  }> {
    const tradingDate = kstTradingDate();
    const engineVersion = RECOMMENDATION_ENGINE_VERSION;
    const profileKey = GLOBAL_RECOMMENDATION_PROFILE_KEY;

    if (!options?.force) {
      const existing = await this.ledgerRepo.findByKey(tradingDate, engineVersion, profileKey);
      if (existing) {
        return { status: 'skipped', batch: existing, tradingDate };
      }
    }

    const [featured, marketContext] = await Promise.all([
      this.featuredQuotesUseCase.execute(),
      this.buildMarketContextUseCase.execute(),
    ]);

    const featuredKr = toFeaturedQuoteInputs(featured.kr);
    const featuredUs = toFeaturedQuoteInputs(featured.us);

    const pool = buildCandidatePool({});
    const featuredKeys = new Set([
      ...featured.kr.map((q) => symbolKey(q.symbol, q.market)),
      ...featured.us.map((q) => symbolKey(q.symbol, q.market)),
    ]);
    const extraCandidates = pool.filter((c) => !featuredKeys.has(symbolKey(c.symbol, c.market)));

    const krSymbols = extraCandidates.filter((c) => c.market === Market.KR).map((c) => c.symbol);
    const usSymbols = extraCandidates.filter((c) => c.market === Market.US).map((c) => c.symbol);
    const [krCatalog, usCatalog] = await Promise.all([
      this.catalogRepo.findBySymbols(krSymbols, Market.KR),
      this.catalogRepo.findBySymbols(usSymbols, Market.US),
    ]);
    const catalogSymbols = [...krCatalog, ...usCatalog].map((c) => ({
      symbol: c.symbol,
      market: c.market,
      name: c.name,
      yahooSymbol: c.yahooSymbol,
    }));

    const poolWithCatalog = buildCandidatePool({ catalogSymbols });
    const quoteTargets = poolWithCatalog.filter(
      (c) => !featuredKeys.has(symbolKey(c.symbol, c.market)),
    );

    const enrichmentTargets = [
      ...quoteTargets.map((c) => ({
        symbol: c.symbol,
        name: c.name,
        market: c.market,
        currency: c.currency,
        yahooSymbol: c.yahooSymbol,
      })),
      ...featured.kr.map((q) => ({ symbol: q.symbol, name: q.name, market: q.market, currency: q.currency })),
      ...featured.us.map((q) => ({ symbol: q.symbol, name: q.name, market: q.market, currency: q.currency })),
    ];

    const { candidateQuotes, technicalSnapshots, newsSnapshots } =
      await this.buildStockEnrichmentUseCase.execute(enrichmentTargets);

    const recResult = buildGlobalBaselineRecommendations({
      featuredKr,
      featuredUs,
      candidateQuotes,
      marketContext: {
        macro: marketContext.macro,
        sectors: marketContext.sectors,
        indices: marketContext.indices,
        usdKrwRate: marketContext.usdKrwRate,
        usdKrwChange1d: marketContext.usdKrwChange1d,
        catalogSymbols,
        technicalSnapshots,
        newsSnapshots,
      },
    });

    const benchmarks = await fetchBenchmarkPrices(this.marketData);
    const runAt = new Date();

    const macroSnapshot: RecommendationBatchMacroSnapshot = {
      usdKrwRate: marketContext.usdKrwRate,
      usdKrwChange1d: marketContext.usdKrwChange1d,
      krSentimentLabel: recResult.kr.label,
      usSentimentLabel: recResult.us.label,
      benchmarks,
    };

    const batch = await this.ledgerRepo.createBatch({
      runAt,
      tradingDate,
      engineVersion,
      profileKey,
      regimes: recResult.regimes,
      macroSnapshot,
      candidatePool: poolWithCatalog.map((c) => ({
        symbol: c.symbol,
        market: c.market,
        source: c.source,
      })),
      items: recResult.recommendations.map((rec, index) => ({
        rank: index + 1,
        symbol: rec.symbol,
        market: rec.market,
        tag: rec.tag,
        score: rec.score ?? 0,
        priceAtRun: rec.currentPrice,
        changePercent1d: rec.changePercent,
        evidence: {
          reasonKey: rec.reasonKey,
          reasonParams: rec.reasonParams,
          evidenceItems: rec.evidenceItems,
          scoreBreakdown: rec.scoreBreakdown,
          regimeContext: rec.regimeContext,
          sectorAlignment: rec.sectorAlignment,
        },
      })),
    });

    return { status: 'created', batch, tradingDate };
  }
}

export class EvaluateRecommendationOutcomesUseCase {
  constructor(
    private readonly ledgerRepo: IRecommendationLedgerRepository,
    private readonly marketData: IMarketDataProvider,
  ) {}

  async execute(): Promise<{ evaluated: number; skipped: number }> {
    const items = await this.ledgerRepo.listItemsForOutcomeEvaluation();
    let evaluated = 0;
    let skipped = 0;
    const now = new Date();
    const benchmarkCache = new Map<string, number>();

    for (const item of items) {
      for (const horizon of RECOMMENDATION_OUTCOME_HORIZONS) {
        const hasOutcome = item.outcomes?.some((o) => o.horizon === horizon);
        if (hasOutcome) {
          skipped += 1;
          continue;
        }
        if (!horizonReady(item.runAt, horizon, now)) {
          skipped += 1;
          continue;
        }

        const quote = await this.fetchQuote(item.symbol, item.market);
        if (!quote) {
          skipped += 1;
          continue;
        }

        const benchKey = item.market === Market.KR ? '^KS11' : '^GSPC';
        let benchNow = benchmarkCache.get(benchKey);
        if (benchNow == null) {
          benchNow = await this.fetchBenchmarkLastClose(benchKey) ?? undefined;
          if (benchNow != null) benchmarkCache.set(benchKey, benchNow);
        }

        const benchAtRun = benchmarkPriceAtRun(item.macroSnapshot, item.market);
        const returnPercent = computeReturnPercent(item.priceAtRun, quote);
        const benchmarkReturn =
          benchAtRun != null && benchNow != null
            ? computeReturnPercent(benchAtRun, benchNow)
            : null;
        const alphaVsBenchmark =
          benchmarkReturn != null ? returnPercent - benchmarkReturn : null;

        await this.ledgerRepo.upsertOutcome({
          itemId: item.id,
          horizon,
          evaluatedAt: now,
          priceAtHorizon: quote,
          returnPercent,
          benchmarkReturn,
          alphaVsBenchmark,
        });
        evaluated += 1;
      }
    }

    return { evaluated, skipped };
  }

  private async fetchQuote(symbol: string, market: Market): Promise<number | null> {
    if (!this.marketData.supports(market) || !this.marketData.isAvailable(market)) return null;
    try {
      const q = await this.marketData.fetchStockQuote({
        id: `ledger:${market}:${symbol}`,
        symbol,
        name: symbol,
        market,
        currency: market === Market.KR ? 'KRW' : 'USD',
        yahooSymbol: resolveYahooSymbol(symbol, market),
        createdAt: new Date(),
      });
      return q.currentPrice;
    } catch {
      return null;
    }
  }

  private async fetchBenchmarkLastClose(yahooSymbol: string): Promise<number | null> {
    try {
      const series = await this.marketData.fetchChartSeries(yahooSymbol);
      return series.closes.at(-1) ?? null;
    } catch {
      return null;
    }
  }
}

export class ListRecommendationHistoryUseCase {
  constructor(private readonly ledgerRepo: IRecommendationLedgerRepository) {}

  execute(input?: { limit?: number; profileKey?: string }) {
    return this.ledgerRepo.listBatches({
      limit: input?.limit ?? 30,
      profileKey: input?.profileKey ?? GLOBAL_RECOMMENDATION_PROFILE_KEY,
    });
  }
}

export class GetRecommendationBatchUseCase {
  constructor(private readonly ledgerRepo: IRecommendationLedgerRepository) {}

  execute(batchId: string) {
    return this.ledgerRepo.findById(batchId);
  }
}

export type { RecommendationOutcomeHorizon };
