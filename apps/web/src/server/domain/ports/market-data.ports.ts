import { Market, QuoteChartRange, StockSearchResult } from '@sar/shared';

/** 차트 시세 한 점 (종가·시각) */
export interface ChartPricePoint {
  timestamp: string;
  close: number;
}

/** 기간별 차트 시세 스냅샷 */
export interface ChartQuoteData {
  currentPrice: number;
  changePercent: number | null;
  points: ChartPricePoint[];
}

/** 일봉 시계열 (기술적 분석·벤치마크용) */
export interface ChartSeriesData {
  symbol: string;
  closes: number[];
  volumes: number[];
  highs: number[];
  lows: number[];
  changePercent1d: number | null;
}

/** 뉴스 헤드라인 (RSS·Finnhub 공통) */
export interface NewsItemData {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  market: Market | 'global';
}

/** USD/KRW 환율 조회 port */
export interface IFxRateProvider {
  fetchUsdKrwRate(): Promise<number | null>;
}

/** Yahoo 기간별 차트 시세 port */
export interface IChartQuoteProvider {
  fetchQuote(symbol: string, range: QuoteChartRange): Promise<ChartQuoteData>;
}

/** Yahoo 일봉 시계열 port */
export interface IChartSeriesProvider {
  fetchSeries(symbol: string, yahooRange?: string, interval?: string): Promise<ChartSeriesData>;
}

/** Google RSS · Finnhub 뉴스 port */
export interface INewsProvider {
  fetchGoogleNews(
    query: string,
    market: Market | 'global',
    hl: string,
    gl: string,
    limit?: number,
  ): Promise<NewsItemData[]>;
  fetchFinnhubMarketNews(
    category: 'general' | 'forex' | 'crypto' | 'merger',
    limit?: number,
  ): Promise<NewsItemData[]>;
}

/** Yahoo 종목 검색 fallback port */
export interface IRemoteStockSearchProvider {
  search(query: string, market: Market): Promise<StockSearchResult[]>;
}
