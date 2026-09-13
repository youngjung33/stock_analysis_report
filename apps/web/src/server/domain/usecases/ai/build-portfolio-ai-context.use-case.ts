import {
  AI_SCHEMA_VERSION,
  AI_NEWS_TITLE_MAX,
  sanitizeMemoForAi,
  buildPortfolioDerivedFacts,
  pickNewsTitlesForAi,
  type PortfolioAiContext,
  type SupportedLocale,
} from '@sar/shared';
import { GetDashboardUseCase } from '../portfolio/get-dashboard.use-case';
import { GetPortfolioAnalysisUseCase } from '../portfolio/get-portfolio-analysis.use-case';
import {
  GetPortfolioPreferencesUseCase,
  GetPortfolioSimulationUseCase,
} from '../portfolio/portfolio-capital.use-cases';
import { ListTransactionsUseCase } from '../transactions/list-transactions.use-case';
import { computeContextHash } from '@/server/data/ai/context-hash';

export class BuildPortfolioAiContextUseCase {
  constructor(
    private readonly getDashboardUseCase: GetDashboardUseCase,
    private readonly getPortfolioAnalysisUseCase: GetPortfolioAnalysisUseCase,
    private readonly getPortfolioSimulationUseCase: GetPortfolioSimulationUseCase,
    private readonly getPortfolioPreferencesUseCase: GetPortfolioPreferencesUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
  ) {}

  async execute(userId: string, locale: SupportedLocale): Promise<PortfolioAiContext> {
    const [dashboard, analysis, simulationBundle, preferences, transactions] = await Promise.all([
      this.getDashboardUseCase.execute(userId),
      this.getPortfolioAnalysisUseCase.execute(userId),
      this.getPortfolioSimulationUseCase.execute(userId),
      this.getPortfolioPreferencesUseCase.execute(userId),
      this.listTransactionsUseCase.execute(userId),
    ]);

    const summary = dashboard.summary;
    const sim = simulationBundle.simulation;
    const profile = simulationBundle.investorProfile;

    const holdingsByWeight = [...dashboard.holdings]
      .sort((a, b) => (b.weightPercent ?? 0) - (a.weightPercent ?? 0))
      .slice(0, 10);

    const memoSamples = transactions
      .map((t) => sanitizeMemoForAi(t.memo))
      .filter((m): m is string => m != null)
      .slice(0, 3);

    const totalValueKrw = summary.totalAssetsKrw ?? summary.totalMarketValueKrw ?? 0;

    const holdingsDigest = analysis.holdingsInsights.slice(0, 8).map((h, idx) => ({
      symbol: h.symbol,
      market: h.market as 'KR' | 'US',
      name: h.name,
      rsi14: h.rsi14,
      newsTitles: pickNewsTitlesForAi(
        h.news.slice(0, AI_NEWS_TITLE_MAX).map((n) => n.title),
      ),
      memoSample: memoSamples[idx] ?? null,
    }));

    const topHoldings = holdingsByWeight.map((h) => ({
      symbol: h.symbol,
      market: h.market as 'KR' | 'US',
      weightPercent: h.weightPercent ?? 0,
    }));

    const facts = {
      summary: {
        totalValueKrw,
        totalPnlKrw: summary.totalUnrealizedPnlKrw ?? 0,
        cashKrw: summary.cashKrw,
        cashUsd: summary.cashUsd,
        holdingCount: summary.holdingsCount,
      },
      investorProfile: profile
        ? {
            compositePercent: profile.compositePercent,
            primaryTypeId: profile.typeId,
            tags: profile.preferredTags,
            adjustmentPercent: profile.adjustmentPercent,
          }
        : null,
      allocation: {
        targetKrPercent: preferences.targetKrPercent,
        targetUsPercent: preferences.targetUsPercent,
        actualKrPercent: sim.stockAllocationByMarket.krPercent,
        actualUsPercent: sim.stockAllocationByMarket.usPercent,
        maxSingleWeightPercent: preferences.maxSingleWeightPercent,
        topHoldings,
      },
      performance: {
        portfolioReturns: analysis.portfolioReturns.slice(0, 4),
        benchmarkComparisons: analysis.benchmarkComparisons.slice(0, 4),
      },
      simulation: {
        actions: sim.actions.slice(0, 6).map((a) => ({
          symbol: a.symbol,
          action: a.type,
          reason: a.reasonKey,
        })),
      },
      holdingsDigest,
      derived: buildPortfolioDerivedFacts({
        totalValueKrw,
        cashKrw: summary.cashKrw,
        cashUsd: summary.cashUsd,
        totalPnlKrw: summary.totalUnrealizedPnlKrw ?? 0,
        targetKrPercent: preferences.targetKrPercent,
        targetUsPercent: preferences.targetUsPercent,
        actualKrPercent: sim.stockAllocationByMarket.krPercent,
        actualUsPercent: sim.stockAllocationByMarket.usPercent,
        topHoldings,
      }),
    };

    const contextHash = computeContextHash({ kind: 'portfolio', facts });

    return {
      schemaVersion: AI_SCHEMA_VERSION,
      kind: 'portfolio',
      locale,
      generatedAt: new Date().toISOString(),
      contextHash,
      constraints: { maxSections: 5, tone: 'educational', noTradeAdvice: true },
      facts,
    };
  }
}
