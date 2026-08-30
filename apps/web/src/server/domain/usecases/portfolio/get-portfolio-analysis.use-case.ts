import {
  Market,
  PortfolioPeriod,
  PORTFOLIO_PERIODS,
  buildRawHoldingsFromStockBundles,
  enrichHoldingKrw,
  resolveYahooSymbol,
} from '@sar/shared';
import { PortfolioAnalysisResult } from '../../entities';
import {
  ICorporateActionRepository,
  IStockQuoteRepository,
  IStockRepository,
  ITransactionRepository,
} from '../../repositories';
import { IMarketDataProvider } from '../../ports/market-data.port';
import {
  analyzePortfolioHoldings,
  type AnalysisHoldingInput,
} from '../../services/portfolio-analysis.service';

export type { AnalysisHoldingInput };

/** 포트폴리오 기간수익률·벤치마크·RSI/뉴스 인사이트 use case */
export class GetPortfolioAnalysisUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly quoteRepo: IStockQuoteRepository,
    private readonly corpActionRepo: ICorporateActionRepository,
    private readonly marketData: IMarketDataProvider,
  ) {}

  /** 기간별 수익률·벤치마크·RSI/뉴스 인사이트 PortfolioAnalysisResult 반환 */
  async execute(
    userId: string,
    periods: PortfolioPeriod[] = PORTFOLIO_PERIODS,
    includeInsights = true,
  ): Promise<PortfolioAnalysisResult> {
    const stocks = await this.stockRepo.findHeldByUser(userId);
    const stockIds = stocks.map((s) => s.id);
    const quotes = await this.quoteRepo.findByStockIds(stockIds);
    const quoteMap = new Map(quotes.map((q) => [q.stockId, q]));

    const bundles = [];
    for (const stock of stocks) {
      const txs = await this.transactionRepo.findByUserAndStock(userId, stock.id);
      const actions = await this.corpActionRepo.findByUserAndStock(userId, stock.id);
      bundles.push({
        stockId: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market as Market,
        currency: stock.currency,
        transactions: txs,
        corporateActions: actions.map((a) => ({
          type: a.type,
          effectiveAt: a.effectiveAt,
          cashAmount: a.cashAmount,
          splitRatio: a.splitRatio,
          targetQuantity: a.targetQuantity,
          targetPrice: a.targetPrice,
        })),
        quote: quoteMap.get(stock.id) ?? null,
      });
    }

    const { rawHoldings, quoteState } = buildRawHoldingsFromStockBundles(bundles);
    const hasUsdHoldings = rawHoldings.some((h) => h.currency === 'USD');
    const usdKrwRate = hasUsdHoldings ? await this.marketData.fetchUsdKrwRate() : null;
    const enriched = rawHoldings.map((h) => ({
      ...h,
      ...enrichHoldingKrw(h, usdKrwRate),
      yahooSymbol: resolveYahooSymbol(h.symbol, h.market as Market),
      weightPercent: null as number | null,
    }));

    return this.executeFromHoldings(enriched, quoteState.hasAllQuotes, periods, includeInsights);
  }

  /** Guest/client snapshot — pre-built dashboard holdings */
  executeFromHoldings(
    holdings: AnalysisHoldingInput[],
    hasAllQuotes: boolean,
    periods: PortfolioPeriod[] = PORTFOLIO_PERIODS,
    includeInsights = true,
  ): Promise<PortfolioAnalysisResult> {
    return analyzePortfolioHoldings(this.marketData, {
      holdings,
      hasAllQuotes,
      periods,
      includeInsights,
    });
  }
}
