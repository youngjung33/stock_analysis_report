import {
  Market,
  type DataSourceStatus,
  type MarketNewsSourceQuality,
  type NewsAnalysisInput,
} from '@sar/shared';
import type { IMarketDataProvider } from '../../ports/market-data.port';

export interface MarketHeadlineNewsResult {
  items: NewsAnalysisInput[];
  quality: MarketNewsSourceQuality;
}

function statusFromItems(items: unknown[], failed: boolean): DataSourceStatus {
  if (failed) return 'failed';
  return items.length > 0 ? 'ok' : 'empty';
}

/** 시장 심층 분석용 헤드라인 뉴스 — 소스별 성공/실패/빈 결과 구분 */
export async function fetchMarketHeadlineNews(
  marketData: IMarketDataProvider,
): Promise<MarketHeadlineNewsResult> {
  let krItems: Awaited<ReturnType<IMarketDataProvider['fetchGoogleNews']>> = [];
  let usItems: Awaited<ReturnType<IMarketDataProvider['fetchGoogleNews']>> = [];
  let finnhubItems: Awaited<ReturnType<IMarketDataProvider['fetchFinnhubMarketNews']>> = [];

  let krFailed = false;
  let usFailed = false;
  let finnhubFailed = false;

  try {
    krItems = await marketData.fetchGoogleNews('코스피+증시+주식', Market.KR, 'ko', 'KR', 6);
  } catch {
    krFailed = true;
  }

  try {
    usItems = await marketData.fetchGoogleNews('US+stock+market+S&P', Market.US, 'en-US', 'US', 6);
  } catch {
    usFailed = true;
  }

  try {
    finnhubItems = await marketData.fetchFinnhubMarketNews('general', 6);
  } catch {
    finnhubFailed = true;
  }

  const news: NewsAnalysisInput[] = [
    ...krItems.map((n) => ({ ...n, market: Market.KR as Market | 'global' })),
    ...usItems.map((n) => ({ ...n, market: Market.US as Market | 'global' })),
    ...finnhubItems.map((n) => ({ ...n, market: 'global' as const })),
  ];

  return {
    items: news,
    quality: {
      krGoogle: statusFromItems(krItems, krFailed),
      usGoogle: statusFromItems(usItems, usFailed),
      finnhubGeneral: statusFromItems(finnhubItems, finnhubFailed),
    },
  };
}
