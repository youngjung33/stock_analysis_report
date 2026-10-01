import { Market, QuoteChartRange } from '@sar/shared';
import { IMarketRepository } from '../../repositories';

/** 클라이언트 market use case — API repository 위임 (서버 Build* / Get* 와 이름 분리) */

/** 코스피·나스닥 지수 시세 조회 use case */
export class GetMarketIndicesUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  execute() {
    return this.marketRepo.getMarketIndices();
  }
}

/** 대시보드 시장 정세 — 지수 + 추천·레짐 (섹터 후보 시세 enrichment) */
export class GetMarketSentimentSummaryUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  execute(options?: {
    userHoldings?: Array<{ symbol: string; market: import('@sar/shared').Market; name?: string }>;
    userWatchlist?: Array<{ symbol: string; market: import('@sar/shared').Market; name?: string }>;
    investorProfile?: import('@sar/shared').StoredInvestorProfile | null;
  }) {
    return this.marketRepo.getMarketSentimentSummary(options);
  }
}

/** 종목 시세·차트 조회 use case */
export class GetStockQuoteUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  /** symbol·market·range 기준 시세·차트 스냅샷 */
  execute(symbol: string, market: Market, range: QuoteChartRange) {
    return this.marketRepo.getStockQuote(symbol, market, range);
  }
}

/** 시장 데이터 제공자 상태 조회 use case */
export class GetMarketStatusUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  /** marketRepo.getMarketStatus — KR/US 제공자 상태 */
  execute() {
    return this.marketRepo.getMarketStatus();
  }
}

/** 시장 심층 분석 리포트 조회 use case */
export class GetMarketAnalysisUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  /** marketRepo.getMarketAnalysis — optional holdings/watchlist personalization */
  execute(options?: {
    userHoldings?: Array<{ symbol: string; market: import('@sar/shared').Market }>;
    userWatchlist?: Array<{ symbol: string; market: import('@sar/shared').Market }>;
    investorProfile?: import('@sar/shared').StoredInvestorProfile | null;
  }) {
    return this.marketRepo.getMarketAnalysis(options);
  }
}

/** 일별 추천 기록(ledger) 조회 use case */
export class GetRecommendationHistoryUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  execute(limit?: number) {
    return this.marketRepo.getRecommendationHistory(limit);
  }
}

/** 종목 검색 use case */
export class SearchStocksUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  /** query·market 기준 종목 검색 결과 */
  execute(query: string, market: Market) {
    return this.marketRepo.searchStocks(query, market);
  }
}

/** USD/KRW 환율 조회 use case */
export class GetFxRateUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  /** marketRepo.getFxRate — usdKrwRate·fetchedAt */
  execute() {
    return this.marketRepo.getFxRate();
  }
}

/** GET /api/market/stock-analysis — 종목 가격 해설 리포트 */
export class FetchStockAnalysisUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  execute(input: {
    symbol: string;
    name: string;
    market: Market;
    yahooSymbol?: string;
  }) {
    return this.marketRepo.getStockAnalysis(input);
  }
}
