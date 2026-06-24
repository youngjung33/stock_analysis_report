import { MarketDataConfig } from './market-data.config';

const FINNHUB_NEWS_URL = 'https://finnhub.io/api/v1/news';

export interface FinnhubNewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export async function fetchFinnhubMarketNews(
  category: 'general' | 'forex' | 'crypto' | 'merger' = 'general',
  limit = 8,
): Promise<FinnhubNewsItem[]> {
  const apiKey = new MarketDataConfig().finnhubApiKey;
  if (!apiKey) return [];

  const url = `${FINNHUB_NEWS_URL}?category=${category}&token=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 300 } });

  if (!res.ok) {
    throw new Error(`Finnhub news API error: ${res.status}`);
  }

  const data = (await res.json()) as FinnhubNewsItem[];
  return data.slice(0, limit);
}

export async function fetchFinnhubCompanyNews(
  symbol: string,
  limit = 3,
): Promise<FinnhubNewsItem[]> {
  const apiKey = new MarketDataConfig().finnhubApiKey;
  if (!apiKey) return [];

  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 7);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const url = `${FINNHUB_NEWS_URL.replace('/news', '/company-news')}?symbol=${encodeURIComponent(symbol)}&from=${fmt(from)}&to=${fmt(to)}&token=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 300 } });

  if (!res.ok) return [];

  const data = (await res.json()) as FinnhubNewsItem[];
  return data.slice(0, limit);
}
