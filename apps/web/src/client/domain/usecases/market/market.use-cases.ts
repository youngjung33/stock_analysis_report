import { Market, QuoteChartRange } from '@sar/shared';
import { IMarketRepository } from '../../repositories';

/** 대표 종목 시세 조회 use case */
export class GetFeaturedQuotesUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  execute() {
    return this.marketRepo.getFeaturedQuotes();
  }
}

/** 종목 시세·차트 조회 use case */
export class GetStockQuoteUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  execute(symbol: string, market: Market, range: QuoteChartRange) {
    return this.marketRepo.getStockQuote(symbol, market, range);
  }
}

/** 시장 데이터 제공자 상태 조회 use case */
export class GetMarketStatusUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  execute() {
    return this.marketRepo.getMarketStatus();
  }
}

/** 시장 심층 분석 리포트 조회 use case */
export class GetMarketAnalysisUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  execute() {
    return this.marketRepo.getMarketAnalysis();
  }
}

/** 종목 검색 use case */
export class SearchStocksUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  execute(query: string, market: Market) {
    return this.marketRepo.searchStocks(query, market);
  }
}

/** USD/KRW 환율 조회 use case */
export class GetFxRateUseCase {
  constructor(private readonly marketRepo: IMarketRepository) {}

  execute() {
    return this.marketRepo.getFxRate();
  }
}
