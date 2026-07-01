import { Market, QuoteChartRange, StockSearchResult } from '@sar/shared';
import { QuoteResult, StockEntity } from '../entities';

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

/**
 * 외부 시장 데이터 단일 port.
 * Yahoo · Finnhub · Google RSS — use case는 이 interface만 의존한다.
 */
export interface IMarketDataProvider {
  supports(market: Market): boolean;
  label(market: Market): string;
  isAvailable(market: Market): boolean;
  unavailableReason(market: Market): string | null;
  /** 보유·Featured 종목 현재가 (KR=Yahoo, US=Finnhub) */
  fetchStockQuote(stock: StockEntity): Promise<QuoteResult>;
  /** USD/KRW 환율 (Yahoo KRW=X) */
  fetchUsdKrwRate(): Promise<number | null>;
  /** 종목 기간별 차트 시세 */
  fetchChartQuote(symbol: string, range: QuoteChartRange): Promise<ChartQuoteData>;
  /** 일봉 시계열 (벤치마크·RSI·시장 분석) */
  fetchChartSeries(symbol: string, yahooRange?: string, interval?: string): Promise<ChartSeriesData>;
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
  /** DB catalog 없을 때 Yahoo 종목 검색 fallback */
  searchRemoteStocks(query: string, market: Market): Promise<StockSearchResult[]>;
}
