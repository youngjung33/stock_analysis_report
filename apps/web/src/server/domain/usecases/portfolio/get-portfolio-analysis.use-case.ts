import {
  Market,
  PortfolioPeriod,
  PERIOD_LABELS,
  PORTFOLIO_PERIODS,
  applyCorporateActions,
  blendBenchmarkReturn,
  compareToBenchmark,
  computeAllocation,
  computeMaxTotalReturn,
  computeWeightedPeriodReturn,
  enrichHoldingKrw,
  periodReturnFromCloses,
  resolveYahooSymbol,
  rsi,
  selectBlendedBenchmark,
} from '@sar/shared';
import { PortfolioAnalysisResult } from '../../entities';
import {
  ICorporateActionRepository,
  IStockQuoteRepository,
  IStockRepository,
  ITransactionRepository,
} from '../../repositories';
import {
  IFxRateProvider,
  IChartSeriesProvider,
  INewsProvider,
} from '../../ports/market-data.ports';

/** Yahoo chart range per portfolio period */
const PERIOD_YAHOO_RANGE: Record<PortfolioPeriod, string> = {
  '1mo': '3mo',
  '3mo': '6mo',
  ytd: 'ytd',
  max: 'max',
};

function rsiLabel(value: number | null): string {
  if (value === null) return '—';
  if (value >= 70) return '과매수';
  if (value <= 30) return '과매도';
  return '중립';
}

/** 포트폴리오 기간수익률·벤치마크·RSI/뉴스 인사이트 use case */
export class GetPortfolioAnalysisUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly quoteRepo: IStockQuoteRepository,
    private readonly corpActionRepo: ICorporateActionRepository,
    private readonly fxRateProvider: IFxRateProvider,
    private readonly chartSeriesProvider: IChartSeriesProvider,
    private readonly newsProvider: INewsProvider,
  ) {}

  async execute(
    userId: string,
    periods: PortfolioPeriod[] = PORTFOLIO_PERIODS,
    includeInsights = true,
  ): Promise<PortfolioAnalysisResult> {
    const stocks = await this.stockRepo.findHeldByUser(userId);
    const stockIds = stocks.map((s) => s.id);
    const quotes = await this.quoteRepo.findByStockIds(stockIds);
    const quoteMap = new Map(quotes.map((q) => [q.stockId, q]));

    const rawHoldings = [];
    let hasAllQuotes = true;

    for (const stock of stocks) {
      const txs = await this.transactionRepo.findByUserAndStock(userId, stock.id);
      const actions = await this.corpActionRepo.findByUserAndStock(userId, stock.id);
      const position = applyCorporateActions(
        txs.map((tx) => ({
          type: tx.type,
          quantity: tx.quantity,
          price: tx.price,
          tradedAt: tx.tradedAt,
        })),
        actions.map((a) => ({
          type: a.type,
          effectiveAt: a.effectiveAt,
          cashAmount: a.cashAmount,
          splitRatio: a.splitRatio,
          targetQuantity: a.targetQuantity,
          targetPrice: a.targetPrice,
        })),
      );

      if (position.quantity <= 0) continue;

      const quote = quoteMap.get(stock.id);
      const currentPrice = quote?.currentPrice ?? null;
      const changePercent = quote?.changePercent ?? null;
      if (!quote) hasAllQuotes = false;

      const marketValue = currentPrice !== null ? currentPrice * position.quantity : null;
      const unrealizedPnl =
        currentPrice !== null ? (currentPrice - position.averageCost) * position.quantity : null;

      rawHoldings.push({
        stockId: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market as Market,
        currency: stock.currency,
        yahooSymbol: stock.yahooSymbol ?? resolveYahooSymbol(stock.symbol, stock.market as Market),
        quantity: position.quantity,
        averageCost: position.averageCost,
        currentPrice,
        changePercent,
        marketValue,
        unrealizedPnl,
        unrealizedPnlPercent: null,
        realizedPnl: position.realizedPnl,
        costBasis: position.costBasis,
      });
    }

    const hasUsdHoldings = rawHoldings.some((h) => h.currency === 'USD');
    const usdKrwRate = hasUsdHoldings ? await this.fxRateProvider.fetchUsdKrwRate() : null;
    const enriched = rawHoldings.map((h) => ({
      ...h,
      ...enrichHoldingKrw(h, usdKrwRate),
    }));

    const allocation = computeAllocation(
      enriched.map((h) => ({
        symbol: h.symbol,
        name: h.name,
        market: h.market,
        marketValueKrw: h.marketValueKrw,
      })),
    );
    const weightMap = new Map(allocation.items.map((i) => [`${i.symbol}:${i.market}`, i.weightPercent]));
    const holdings = enriched.map((h) => ({
      ...h,
      weightPercent: weightMap.get(`${h.symbol}:${h.market}`) ?? null,
    }));

    const totalCostBasisKrw = holdings.reduce((s, h) => s + h.costBasisKrw, 0);
    const totalMarketValueKrw = hasAllQuotes
      ? holdings.reduce((s, h) => s + (h.marketValueKrw ?? 0), 0)
      : null;
    const totalRealizedPnlKrw = holdings.reduce((s, h) => s + h.realizedPnlKrw, 0);

    const holdingReturns = await Promise.all(
      holdings.slice(0, 20).map(async (h) => {
        const periodReturns: Partial<Record<PortfolioPeriod, number | null>> = {};
        if (!h.yahooSymbol) {
          for (const p of periods) periodReturns[p] = null;
          return { symbol: h.symbol, market: h.market, periodReturns };
        }

        try {
          const seriesByPeriod = await Promise.all(
            periods
              .filter((p) => p !== 'max')
              .map(async (p) => {
                const series = await this.chartSeriesProvider.fetchSeries(
                  h.yahooSymbol!,
                  PERIOD_YAHOO_RANGE[p],
                );
                return { period: p, closes: series.closes };
              }),
          );

          for (const { period, closes } of seriesByPeriod) {
            periodReturns[period] = periodReturnFromCloses(closes, period);
          }
          if (periods.includes('max')) {
            periodReturns.max = computeMaxTotalReturn(
              h.marketValueKrw,
              h.costBasisKrw,
              h.realizedPnlKrw,
            );
          }
        } catch {
          for (const p of periods) periodReturns[p] = null;
        }

        return { symbol: h.symbol, market: h.market, periodReturns };
      }),
    );

    const portfolioReturns = periods.map((period) => {
      if (period === 'max') {
        const ret = computeMaxTotalReturn(totalMarketValueKrw, totalCostBasisKrw, totalRealizedPnlKrw);
        return { period, label: PERIOD_LABELS[period], returnPercent: ret, coveragePercent: ret !== null ? 100 : 0 };
      }

      const inputs = holdings
        .map((h) => {
          const hr = holdingReturns.find((r) => r.symbol === h.symbol && r.market === h.market);
          return {
            weightPercent: h.weightPercent ?? 0,
            returnPercent: hr?.periodReturns[period] ?? null,
          };
        })
        .filter((i) => i.weightPercent > 0);

      const weighted = computeWeightedPeriodReturn(inputs);
      return {
        period,
        label: PERIOD_LABELS[period],
        returnPercent: weighted.returnPercent,
        coveragePercent: weighted.coveragePercent,
      };
    });

    const { krWeight, usWeight, krBenchmark, usBenchmark } = selectBlendedBenchmark(
      allocation.allocationByMarket,
    );

    const benchmarkComparisons = await Promise.all(
      portfolioReturns.map(async (pr) => {
        if (pr.returnPercent === null) {
          return {
            period: pr.period,
            label: pr.label,
            portfolioReturn: null,
            benchmarkName: 'Blended',
            benchmarkReturn: null,
            alpha: null,
          };
        }

        try {
          const [krSeries, usSeries] = await Promise.all([
            this.chartSeriesProvider.fetchSeries(krBenchmark.yahooSymbol, PERIOD_YAHOO_RANGE[pr.period]),
            this.chartSeriesProvider.fetchSeries(usBenchmark.yahooSymbol, PERIOD_YAHOO_RANGE[pr.period]),
          ]);
          const krRet = periodReturnFromCloses(krSeries.closes, pr.period);
          const usRet = periodReturnFromCloses(usSeries.closes, pr.period);
          const blended = blendBenchmarkReturn(krRet, usRet, krWeight, usWeight);
          const cmp = compareToBenchmark(pr.returnPercent, blended, 'Blended Index', 'blend');
          return {
            period: pr.period,
            label: pr.label,
            portfolioReturn: pr.returnPercent,
            benchmarkName: `${krBenchmark.name}/${usBenchmark.name}`,
            benchmarkReturn: cmp.benchmarkReturn,
            alpha: cmp.alpha,
          };
        } catch {
          return {
            period: pr.period,
            label: pr.label,
            portfolioReturn: pr.returnPercent,
            benchmarkName: 'Blended',
            benchmarkReturn: null,
            alpha: null,
          };
        }
      }),
    );

    let holdingsInsights: PortfolioAnalysisResult['holdingsInsights'] = [];
    if (includeInsights && holdings.length > 0) {
      holdingsInsights = await Promise.all(
        holdings.slice(0, 20).map(async (h) => {
          let rsi14: number | null = null;
          let news: PortfolioAnalysisResult['holdingsInsights'][number]['news'] = [];

          if (h.yahooSymbol) {
            try {
              const series = await this.chartSeriesProvider.fetchSeries(h.yahooSymbol, '6mo');
              rsi14 = rsi(series.closes, 14);
            } catch {
              rsi14 = null;
            }
          }

          try {
            const items = await this.newsProvider.fetchGoogleNews(
              `${h.name} ${h.symbol}`,
              h.market,
              h.market === Market.KR ? 'ko' : 'en-US',
              h.market === Market.KR ? 'KR' : 'US',
              3,
            );
            news = items.map((n) => ({ title: n.title, url: n.url, source: n.source }));
          } catch {
            news = [];
          }

          return {
            symbol: h.symbol,
            market: h.market,
            name: h.name,
            rsi14,
            rsiLabel: rsiLabel(rsi14),
            news,
          };
        }),
      );
    }

    return {
      portfolioReturns,
      holdingReturns,
      benchmarkComparisons,
      holdingsInsights,
      fxRate: usdKrwRate,
      asOf: new Date().toISOString(),
      allocationByMarket: allocation.allocationByMarket,
    };
  }
}
