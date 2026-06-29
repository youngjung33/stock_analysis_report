import { Market, QuoteChartRange, StockSearchResult } from '@sar/shared';
import {
  ChartQuoteData,
  ChartSeriesData,
  IChartQuoteProvider,
  IChartSeriesProvider,
  IFxRateProvider,
  INewsProvider,
  IRemoteStockSearchProvider,
  NewsItemData,
} from '../../domain/ports/market-data.ports';
import { fetchFinnhubMarketNews } from './finnhub-news.client';
import { fetchGoogleNewsRss } from './google-news-rss.client';
import { fetchUsdKrwRate } from './usd-krw.client';
import { fetchYahooChartQuote, fetchYahooChartSeries } from './yahoo-chart.client';
import { fetchYahooStockSearch } from './yahoo-search.client';

/** Yahoo KRW=X 환율 adapter */
export class YahooFxRateProvider implements IFxRateProvider {
  fetchUsdKrwRate() {
    return fetchUsdKrwRate();
  }
}

/** Yahoo 차트 시세 adapter */
export class YahooChartQuoteProvider implements IChartQuoteProvider {
  async fetchQuote(symbol: string, range: QuoteChartRange): Promise<ChartQuoteData> {
    const quote = await fetchYahooChartQuote(symbol, range);
    return {
      currentPrice: quote.currentPrice,
      changePercent: quote.changePercent,
      points: quote.points,
    };
  }
}

/** Yahoo 일봉 시계열 adapter */
export class YahooChartSeriesProvider implements IChartSeriesProvider {
  async fetchSeries(
    symbol: string,
    yahooRange = '1y',
    interval = '1d',
  ): Promise<ChartSeriesData> {
    const series = await fetchYahooChartSeries(symbol, yahooRange, interval);
    return {
      symbol: series.symbol,
      closes: series.closes,
      volumes: series.volumes,
      highs: series.highs,
      lows: series.lows,
      changePercent1d: series.changePercent1d,
    };
  }
}

/** Google RSS + Finnhub 뉴스 adapter */
export class ExternalNewsProvider implements INewsProvider {
  async fetchGoogleNews(
    query: string,
    market: Market | 'global',
    hl: string,
    gl: string,
    limit = 6,
  ): Promise<NewsItemData[]> {
    const items = await fetchGoogleNewsRss(query, market, hl, gl, limit);
    return items.map((item) => ({
      title: item.title,
      source: item.source,
      publishedAt: item.publishedAt,
      url: item.url,
      market: item.market,
    }));
  }

  async fetchFinnhubMarketNews(
    category: 'general' | 'forex' | 'crypto' | 'merger',
    limit = 8,
  ): Promise<NewsItemData[]> {
    const items = await fetchFinnhubMarketNews(category, limit);
    return items.map((item) => ({
      title: item.headline,
      source: item.source,
      publishedAt: new Date(item.datetime * 1000).toISOString(),
      url: item.url,
      market: 'global' as const,
    }));
  }
}

/** Yahoo 종목 검색 adapter */
export class YahooRemoteStockSearchProvider implements IRemoteStockSearchProvider {
  search(query: string, market: Market): Promise<StockSearchResult[]> {
    return fetchYahooStockSearch(query, market);
  }
}
