import {
  Market,
  PortfolioPeriod,
  PERIOD_LABELS,
  computeAllocation,
  computeMaxTotalReturn,
  computeWeightedPeriodReturn,
  blendBenchmarkReturn,
  compareToBenchmark,
  periodReturnFromCloses,
  resolveYahooSymbol,
  rsi,
  selectBlendedBenchmark,
} from '@sar/shared';
import { PortfolioAnalysisResult } from '../entities';
import { IMarketDataProvider } from '../ports/market-data.port';

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

export interface AnalysisHoldingInput {
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  yahooSymbol?: string | null;
  quantity: number;
  averageCost: number;
  currentPrice: number | null;
  changePercent: number | null;
  marketValue: number | null;
  unrealizedPnl: number | null;
  realizedPnl: number;
  costBasis: number;
  marketValueKrw: number | null;
  costBasisKrw: number;
  unrealizedPnlKrw: number | null;
  realizedPnlKrw: number;
  weightPercent: number | null;
}

export interface AnalyzePortfolioHoldingsInput {
  holdings: AnalysisHoldingInput[];
  hasAllQuotes: boolean;
  periods: PortfolioPeriod[];
  includeInsights: boolean;
}

/** Enriched holdings → period returns, benchmarks, RSI/news insights */
export async function analyzePortfolioHoldings(
  marketData: IMarketDataProvider,
  input: AnalyzePortfolioHoldingsInput,
): Promise<PortfolioAnalysisResult> {
  const { holdings: rawHoldings, hasAllQuotes, periods, includeInsights } = input;

  const hasUsdHoldings = rawHoldings.some((h) => h.currency === 'USD');
  const usdKrwRate = hasUsdHoldings ? await marketData.fetchUsdKrwRate() : null;

  const allocation = computeAllocation(
    rawHoldings.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      market: h.market,
      marketValueKrw: h.marketValueKrw,
    })),
  );
  const weightMap = new Map(allocation.items.map((i) => [`${i.symbol}:${i.market}`, i.weightPercent]));

  const holdings = rawHoldings.map((h) => ({
    ...h,
    yahooSymbol:
      h.yahooSymbol ?? resolveYahooSymbol(h.symbol, h.market as Market),
    weightPercent: h.weightPercent ?? weightMap.get(`${h.symbol}:${h.market}`) ?? null,
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
              const series = await marketData.fetchChartSeries(h.yahooSymbol!, PERIOD_YAHOO_RANGE[p]);
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
      return {
        period,
        label: PERIOD_LABELS[period],
        returnPercent: ret,
        coveragePercent: ret !== null ? 100 : 0,
      };
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
          marketData.fetchChartSeries(krBenchmark.yahooSymbol, PERIOD_YAHOO_RANGE[pr.period]),
          marketData.fetchChartSeries(usBenchmark.yahooSymbol, PERIOD_YAHOO_RANGE[pr.period]),
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
            const series = await marketData.fetchChartSeries(h.yahooSymbol, '6mo');
            rsi14 = rsi(series.closes, 14);
          } catch {
            rsi14 = null;
          }
        }

        try {
          const items = await marketData.fetchGoogleNews(
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
