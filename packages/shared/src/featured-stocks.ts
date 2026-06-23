import { Market } from './enums';

export interface FeaturedStock {
  symbol: string;
  name: string;
  market: Market;
}

/** 대시보드 기본 시세 — 한국 대표 종목 */
export const FEATURED_KR_STOCKS: FeaturedStock[] = [
  { symbol: '005930', name: '삼성전자', market: Market.KR },
  { symbol: '000660', name: 'SK하이닉스', market: Market.KR },
  { symbol: '035420', name: 'NAVER', market: Market.KR },
  { symbol: '035720', name: '카카오', market: Market.KR },
  { symbol: '005380', name: '현대차', market: Market.KR },
  { symbol: '051910', name: 'LG화학', market: Market.KR },
];

/** 대시보드 기본 시세 — 미국 대표 종목 */
export const FEATURED_US_STOCKS: FeaturedStock[] = [
  { symbol: 'AAPL', name: 'Apple', market: Market.US },
  { symbol: 'MSFT', name: 'Microsoft', market: Market.US },
  { symbol: 'NVDA', name: 'NVIDIA', market: Market.US },
  { symbol: 'GOOGL', name: 'Alphabet', market: Market.US },
  { symbol: 'AMZN', name: 'Amazon', market: Market.US },
  { symbol: 'META', name: 'Meta', market: Market.US },
];

export const FEATURED_STOCKS: FeaturedStock[] = [...FEATURED_KR_STOCKS, ...FEATURED_US_STOCKS];

export function featuredStockId(symbol: string, market: Market): string {
  return `featured-${market}-${symbol}`;
}

export function findFeaturedStock(symbol: string, market: Market): FeaturedStock | undefined {
  return FEATURED_STOCKS.find((s) => s.symbol === symbol && s.market === market);
}
